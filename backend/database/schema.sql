CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hmi_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    current_stage VARCHAR(50) NOT NULL DEFAULT 'POWER_ON',
    operation_status VARCHAR(20) NOT NULL DEFAULT 'READY',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS machine_checks (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES hmi_sessions(id) ON DELETE CASCADE,
    check_order INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    instruction TEXT NOT NULL,
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(session_id, check_order)
);

CREATE TABLE IF NOT EXISTS required_tools (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES hmi_sessions(id) ON DELETE CASCADE,
    tool_order INTEGER NOT NULL,
    tool_number VARCHAR(20) NOT NULL,
    tool_type VARCHAR(150) NOT NULL,
    program_revision VARCHAR(50) NOT NULL,
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(session_id, tool_order)
);

CREATE TABLE IF NOT EXISTS workpiece_setup (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES hmi_sessions(id) ON DELETE CASCADE,
    fixture VARCHAR(150) NOT NULL,
    orientation TEXT NOT NULL,
    clamping_instruction TEXT NOT NULL,
    material VARCHAR(100) NOT NULL,
    drawing_revision VARCHAR(50) NOT NULL,
    work_offset VARCHAR(20) NOT NULL,
    confirmed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS production_setup (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES hmi_sessions(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    operation_name VARCHAR(200) NOT NULL,
    material VARCHAR(100) NOT NULL,
    drawing_revision VARCHAR(50) NOT NULL,
    cnc_program VARCHAR(100) NOT NULL,
    fixture VARCHAR(150) NOT NULL,
    work_offset VARCHAR(20) NOT NULL,
    UNIQUE(session_id)
);