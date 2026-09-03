import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import pool from "../config/database";

export const getHmiSession = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // For now we use the authenticated demo user's ID.
    // The authentication middleware will populate req.user later.
    const userId = req.user?.userId;

if (!userId) {
  res.status(401).json({
    message: "Authentication required",
  });
  return;
}

    const sessionResult = await pool.query(
      `
      SELECT
        id,
        current_stage,
        operation_status,
        updated_at
      FROM hmi_sessions
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (sessionResult.rows.length === 0) {
      res.status(404).json({
        message: "HMI session not found",
      });
      return;
    }

    const session = sessionResult.rows[0];

    const [
      productionResult,
      machineChecksResult,
      toolsResult,
      workpieceResult,
    ] = await Promise.all([
      pool.query(
        `
        SELECT
          quantity,
          operation_name,
          material,
          drawing_revision,
          cnc_program,
          fixture,
          work_offset
        FROM production_setup
        WHERE session_id = $1
        `,
        [session.id]
      ),

      pool.query(
        `
        SELECT
          id,
          check_order,
          name,
          instruction,
          confirmed
        FROM machine_checks
        WHERE session_id = $1
        ORDER BY check_order
        `,
        [session.id]
      ),

      pool.query(
        `
        SELECT
          id,
          tool_order,
          tool_number,
          tool_type,
          program_revision,
          confirmed
        FROM required_tools
        WHERE session_id = $1
        ORDER BY tool_order
        `,
        [session.id]
      ),

      pool.query(
        `
        SELECT
          id,
          fixture,
          orientation,
          clamping_instruction,
          material,
          drawing_revision,
          work_offset,
          confirmed
        FROM workpiece_setup
        WHERE session_id = $1
        `,
        [session.id]
      ),
    ]);

    res.json({
      session: {
        id: session.id,
        currentStage: session.current_stage,
        operationStatus: session.operation_status,
        updatedAt: session.updated_at,
      },
      production: productionResult.rows[0] ?? null,
      machineChecks: machineChecksResult.rows,
      requiredTools: toolsResult.rows,
      workpieceSetup: workpieceResult.rows[0] ?? null,
    });
  } catch (error) {
    console.error("Get HMI session error:", error);

    res.status(500).json({
      message: "Failed to load HMI session",
    });
  }
};



export const confirmMachineCheck = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const checkId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!Number.isInteger(checkId)) {
      res.status(400).json({
        message: "Invalid machine check ID",
      });
      return;
    }

    const result = await pool.query(
      `
      UPDATE machine_checks mc
      SET confirmed = TRUE
      FROM hmi_sessions hs
      WHERE mc.id = $1
        AND mc.session_id = hs.id
        AND hs.user_id = $2
        AND hs.current_stage = 'MACHINE_CHECKS'
      RETURNING
        mc.id,
        mc.check_order,
        mc.name,
        mc.confirmed
      `,
      [checkId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Machine check not found or not available in the current stage",
      });
      return;
    }

    res.json({
      message: "Machine check confirmed",
      machineCheck: result.rows[0],
    });
  } catch (error) {
    console.error("Confirm machine check error:", error);

    res.status(500).json({
      message: "Failed to confirm machine check",
    });
  }
};

export const confirmTool = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const toolId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!Number.isInteger(toolId)) {
      res.status(400).json({
        message: "Invalid tool ID",
      });
      return;
    }

    const result = await pool.query(
      `
      UPDATE required_tools rt
      SET confirmed = TRUE
      FROM hmi_sessions hs
      WHERE rt.id = $1
        AND rt.session_id = hs.id
        AND hs.user_id = $2
        AND hs.current_stage = 'TOOLS'
      RETURNING
        rt.id,
        rt.tool_order,
        rt.tool_number,
        rt.tool_type,
        rt.confirmed
      `,
      [toolId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Tool not found or not available in the current stage",
      });
      return;
    }

    res.json({
      message: "Tool confirmed",
      tool: result.rows[0],
    });
  } catch (error) {
    console.error("Confirm tool error:", error);

    res.status(500).json({
      message: "Failed to confirm tool",
    });
  }
};

export const confirmWorkpiece = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const result = await pool.query(
      `
      UPDATE workpiece_setup ws
      SET confirmed = TRUE
      FROM hmi_sessions hs
      WHERE ws.session_id = hs.id
        AND hs.user_id = $1
        AND hs.current_stage = 'WORKPIECE'
      RETURNING
        ws.id,
        ws.fixture,
        ws.orientation,
        ws.clamping_instruction,
        ws.material,
        ws.drawing_revision,
        ws.work_offset,
        ws.confirmed
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Workpiece setup not found or not available in the current stage",
      });
      return;
    }

    res.json({
      message: "Workpiece setup confirmed",
      workpieceSetup: result.rows[0],
    });
  } catch (error) {
    console.error("Confirm workpiece error:", error);

    res.status(500).json({
      message: "Failed to confirm workpiece setup",
    });
  }
};

export const goToNextStage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const sessionResult = await pool.query(
      `
      SELECT id, current_stage, operation_status
      FROM hmi_sessions
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (sessionResult.rows.length === 0) {
      res.status(404).json({
        message: "HMI session not found",
      });
      return;
    }

    const session = sessionResult.rows[0];

    if (session.current_stage === "POWER_ON") {
      await pool.query(
        `
        UPDATE hmi_sessions
        SET current_stage = 'MACHINE_CHECKS',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [session.id]
      );

      res.json({
        message: "Moved to MACHINE_CHECKS",
        currentStage: "MACHINE_CHECKS",
      });
      return;
    }

    if (session.current_stage === "MACHINE_CHECKS") {
      const result = await pool.query(
        `
        SELECT COUNT(*)::int AS remaining
        FROM machine_checks
        WHERE session_id = $1
          AND confirmed = FALSE
        `,
        [session.id]
      );

      const remaining = result.rows[0].remaining;

      if (remaining > 0) {
        res.status(400).json({
          message: "Complete all machine checks before continuing",
          remaining,
        });
        return;
      }

      await pool.query(
        `
        UPDATE hmi_sessions
        SET current_stage = 'TOOLS',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [session.id]
      );

      res.json({
        message: "Machine checks complete. Moved to TOOLS",
        currentStage: "TOOLS",
      });
      return;
    }

    if (session.current_stage === "TOOLS") {
      const result = await pool.query(
        `
        SELECT COUNT(*)::int AS remaining
        FROM required_tools
        WHERE session_id = $1
          AND confirmed = FALSE
        `,
        [session.id]
      );

      const remaining = result.rows[0].remaining;

      if (remaining > 0) {
        res.status(400).json({
          message: "Confirm all required tools before continuing",
          remaining,
        });
        return;
      }

      await pool.query(
        `
        UPDATE hmi_sessions
        SET current_stage = 'WORKPIECE',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [session.id]
      );

      res.json({
        message: "Tools complete. Moved to WORKPIECE",
        currentStage: "WORKPIECE",
      });
      return;
    }

    if (session.current_stage === "WORKPIECE") {
      const result = await pool.query(
        `
        SELECT COUNT(*)::int AS unconfirmed
        FROM workpiece_setup
        WHERE session_id = $1
          AND confirmed = FALSE
        `,
        [session.id]
      );

      const unconfirmed = result.rows[0].unconfirmed;

      if (unconfirmed > 0) {
        res.status(400).json({
          message: "Confirm the workpiece setup before continuing",
        });
        return;
      }

      await pool.query(
        `
        UPDATE hmi_sessions
        SET current_stage = 'READY',
            operation_status = 'READY',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [session.id]
      );

      res.json({
        message: "Workpiece setup complete. System is READY",
        currentStage: "READY",
        operationStatus: "READY",
      });
      return;
    }

    if (session.current_stage === "READY") {
      await pool.query(
        `
        UPDATE hmi_sessions
        SET current_stage = 'OPERATION',
            operation_status = 'READY',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [session.id]
      );

      res.json({
        message: "Moved to OPERATION",
        currentStage: "OPERATION",
        operationStatus: "READY",
      });
      return;
    }

    if (session.current_stage === "OPERATION") {
      res.status(400).json({
        message: "The operation stage is already active",
      });
      return;
    }

    res.status(400).json({
      message: `Cannot advance from stage ${session.current_stage}`,
    });
  } catch (error) {
    console.error("Go to next stage error:", error);

    res.status(500).json({
      message: "Failed to move to the next stage",
    });
  }
};

export const startOperation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const sessionResult = await pool.query(
      `
      SELECT id, current_stage, operation_status
      FROM hmi_sessions
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (sessionResult.rows.length === 0) {
      res.status(404).json({
        message: "HMI session not found",
      });
      return;
    }

    const session = sessionResult.rows[0];

    if (session.current_stage !== "OPERATION") {
      res.status(400).json({
        message: "Operation cannot start before reaching the OPERATION stage",
      });
      return;
    }

    if (session.operation_status !== "READY") {
      res.status(400).json({
        message: `Operation cannot start from status ${session.operation_status}`,
      });
      return;
    }

    const result = await pool.query(
      `
      UPDATE hmi_sessions
      SET operation_status = 'RUNNING',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, current_stage, operation_status, updated_at
      `,
      [session.id]
    );

    res.json({
      message: "Operation started",
      session: result.rows[0],
    });
  } catch (error) {
    console.error("Start operation error:", error);

    res.status(500).json({
      message: "Failed to start operation",
    });
  }
};

export const stopOperation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const sessionResult = await pool.query(
      `
      SELECT id, current_stage, operation_status
      FROM hmi_sessions
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (sessionResult.rows.length === 0) {
      res.status(404).json({
        message: "HMI session not found",
      });
      return;
    }

    const session = sessionResult.rows[0];

    if (session.current_stage !== "OPERATION") {
      res.status(400).json({
        message: "Operation is not currently active",
      });
      return;
    }

    if (session.operation_status !== "RUNNING") {
      res.status(400).json({
        message: `Operation cannot stop from status ${session.operation_status}`,
      });
      return;
    }

    const result = await pool.query(
      `
      UPDATE hmi_sessions
      SET operation_status = 'STOPPED',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, current_stage, operation_status, updated_at
      `,
      [session.id]
    );

    res.json({
      message: "Operation stopped",
      session: result.rows[0],
    });
  } catch (error) {
    console.error("Stop operation error:", error);

    res.status(500).json({
      message: "Failed to stop operation",
    });
  }
};

export const resetHmiSession = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const sessionResult = await pool.query(
      `
      SELECT id
      FROM hmi_sessions
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (sessionResult.rows.length === 0) {
      res.status(404).json({
        message: "HMI session not found",
      });
      return;
    }

    const sessionId = sessionResult.rows[0].id;

    await pool.query("BEGIN");

    await pool.query(
      `
      UPDATE hmi_sessions
      SET current_stage = 'POWER_ON',
          operation_status = 'READY',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [sessionId]
    );

    await pool.query(
      `
      UPDATE machine_checks
      SET confirmed = FALSE
      WHERE session_id = $1
      `,
      [sessionId]
    );

    await pool.query(
      `
      UPDATE required_tools
      SET confirmed = FALSE
      WHERE session_id = $1
      `,
      [sessionId]
    );

    await pool.query(
      `
      UPDATE workpiece_setup
      SET confirmed = FALSE
      WHERE session_id = $1
      `,
      [sessionId]
    );

    await pool.query("COMMIT");

    res.json({
      message: "HMI session reset",
      currentStage: "POWER_ON",
      operationStatus: "READY",
    });
  } catch (error) {
    await pool.query("ROLLBACK");

    console.error("Reset HMI session error:", error);

    res.status(500).json({
      message: "Failed to reset HMI session",
    });
  }
};