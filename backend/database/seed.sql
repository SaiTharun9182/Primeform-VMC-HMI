-- Demo operator account
INSERT INTO users (username, password_hash)
VALUES (
    'primeform-demo-saitharun',
    '$2b$10$HRZ5wQqWHakKnu3dKyvTm.3d1dHUQfwSfJmLGKJQnlmBoHsg8iar2'
)
ON CONFLICT (username) DO NOTHING;


-- Create one HMI session for the demo operator
INSERT INTO hmi_sessions (user_id, current_stage, operation_status)
SELECT
    id,
    'POWER_ON',
    'READY'
FROM users
WHERE username = 'primeform-demo-saitharun'
  AND NOT EXISTS (
      SELECT 1
      FROM hmi_sessions hs
      WHERE hs.user_id = users.id
  );


-- Machine checks
INSERT INTO machine_checks
(
    session_id,
    check_order,
    name,
    instruction
)
SELECT
    hs.id,
    v.check_order,
    v.name,
    v.instruction
FROM hmi_sessions hs
CROSS JOIN (
    VALUES
        (
            1,
            'Power / control available',
            'Verify that the machine control and power are available.'
        ),
        (
            2,
            'E-stop released',
            'Verify that the emergency stop is released.'
        ),
        (
            3,
            'Guard / door closed',
            'Verify that the machine guard and door are fully closed.'
        ),
        (
            4,
            'No active alarm',
            'Verify that there are no active machine alarms.'
        ),
        (
            5,
            'Lubrication / coolant ready',
            'Verify that lubrication and coolant systems are ready.'
        ),
        (
            6,
            'Reference return complete',
            'Verify that the machine has completed reference return.'
        )
) AS v(check_order, name, instruction)
WHERE hs.current_stage = 'POWER_ON'
ON CONFLICT (session_id, check_order) DO NOTHING;


-- Required tools
INSERT INTO required_tools
(
    session_id,
    tool_order,
    tool_number,
    tool_type,
    program_revision
)
SELECT
    hs.id,
    v.tool_order,
    v.tool_number,
    v.tool_type,
    v.program_revision
FROM hmi_sessions hs
CROSS JOIN (
    VALUES
        (
            1,
            'T01',
            '50 mm Face Mill',
            'AH204-VMC Rev 03'
        ),
        (
            2,
            'T02',
            '10 mm Carbide Drill',
            'AH204-VMC Rev 03'
        ),
        (
            3,
            'T03',
            '12 mm Carbide End Mill',
            'AH204-VMC Rev 03'
        )
) AS v(
    tool_order,
    tool_number,
    tool_type,
    program_revision
)
WHERE hs.current_stage = 'POWER_ON'
ON CONFLICT (session_id, tool_order) DO NOTHING;


-- Workpiece setup
INSERT INTO workpiece_setup
(
    session_id,
    fixture,
    orientation,
    clamping_instruction,
    material,
    drawing_revision,
    work_offset,
    confirmed
)
SELECT
    hs.id,
    'Precision Machine Vice + Parallels',
    'Seat the aluminum housing square against the fixed jaw with the reference face upward.',
    'Clamp the workpiece securely against the fixed jaw and verify stable seating before machining.',
    'Aluminum 6061-T6',
    'AH-204 Rev B',
    'G54',
    FALSE
FROM hmi_sessions hs
WHERE hs.current_stage = 'POWER_ON'
  AND NOT EXISTS (
      SELECT 1
      FROM workpiece_setup ws
      WHERE ws.session_id = hs.id
  );


-- Production scenario
INSERT INTO production_setup
(
    session_id,
    quantity,
    operation_name,
    material,
    drawing_revision,
    cnc_program,
    fixture,
    work_offset
)
SELECT
    hs.id,
    20,
    'Aluminum Housing Face Milling & Drilling',
    'Aluminum 6061-T6',
    'AH-204 Rev B',
    'AH204-VMC Rev 03',
    'Precision Machine Vice + Parallels',
    'G54'
FROM hmi_sessions hs
WHERE hs.current_stage = 'POWER_ON'
  AND NOT EXISTS (
      SELECT 1
      FROM production_setup ps
      WHERE ps.session_id = hs.id
  );