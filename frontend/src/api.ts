const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
  };
}

export interface HmiSession {
  session: {
    id: number;
    currentStage: string;
    operationStatus: "READY" | "RUNNING" | "STOPPED";
    updatedAt: string;
  };
  production: {
    quantity: number;
    operation_name: string;
    material: string;
    drawing_revision: string;
    cnc_program: string;
    fixture: string;
    work_offset: string;
  };
  machineChecks: MachineCheck[];
  requiredTools: RequiredTool[];
  workpieceSetup: WorkpieceSetup | null;
}

export interface MachineCheck {
  id: number;
  check_order: number;
  name: string;
  instruction: string;
  confirmed: boolean;
}

export interface RequiredTool {
  id: number;
  tool_order: number;
  tool_number: string;
  tool_type: string;
  program_revision: string;
  confirmed: boolean;
}

export interface WorkpieceSetup {
  id: number;
  fixture: string;
  orientation: string;
  clamping_instruction: string;
  material: string;
  drawing_revision: string;
  work_offset: string;
  confirmed: boolean;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  return parseResponse<LoginResponse>(response);
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getHmiSession(token: string): Promise<HmiSession> {
  const response = await fetch(`${API_URL}/hmi/session`, {
    headers: authHeaders(token),
  });

  return parseResponse<HmiSession>(response);
}

export async function nextStage(token: string): Promise<{
  message: string;
  currentStage: string;
  operationStatus?: string;
}> {
  const response = await fetch(`${API_URL}/hmi/next`, {
    method: "POST",
    headers: authHeaders(token),
  });

  return parseResponse(response);
}

export async function confirmMachineCheck(
  token: string,
  id: number
): Promise<void> {
  const response = await fetch(`${API_URL}/hmi/machine-checks/${id}/confirm`, {
    method: "POST",
    headers: authHeaders(token),
  });

  await parseResponse(response);
}

export async function confirmTool(
  token: string,
  id: number
): Promise<void> {
  const response = await fetch(`${API_URL}/hmi/tools/${id}/confirm`, {
    method: "POST",
    headers: authHeaders(token),
  });

  await parseResponse(response);
}

export async function confirmWorkpiece(token: string): Promise<void> {
  const response = await fetch(`${API_URL}/hmi/workpiece/confirm`, {
    method: "POST",
    headers: authHeaders(token),
  });

  await parseResponse(response);
}

export async function startOperation(token: string): Promise<void> {
  const response = await fetch(`${API_URL}/hmi/start`, {
    method: "POST",
    headers: authHeaders(token),
  });

  await parseResponse(response);
}

export async function stopOperation(token: string): Promise<void> {
  const response = await fetch(`${API_URL}/hmi/stop`, {
    method: "POST",
    headers: authHeaders(token),
  });

  await parseResponse(response);
}

export async function resetHmiSession(token: string): Promise<void> {
  const response = await fetch(`${API_URL}/hmi/reset`, {
    method: "POST",
    headers: authHeaders(token),
  });

  await parseResponse(response);
}