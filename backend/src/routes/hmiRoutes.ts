import { Router } from "express";
import {
  getHmiSession,
  confirmMachineCheck,
  confirmTool,
  confirmWorkpiece,
  goToNextStage,
  startOperation,
  stopOperation,
  resetHmiSession,
} from "../controllers/hmiController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/session", authenticateToken, getHmiSession);

router.post(
  "/machine-checks/:id/confirm",
  authenticateToken,
  confirmMachineCheck
);

router.post(
  "/tools/:id/confirm",
  authenticateToken,
  confirmTool
);

router.post(
  "/workpiece/confirm",
  authenticateToken,
  confirmWorkpiece
);

router.post("/next", authenticateToken, goToNextStage);

router.post("/start", authenticateToken, startOperation);

router.post("/stop", authenticateToken, stopOperation);

router.post("/reset", authenticateToken, resetHmiSession);

export default router;