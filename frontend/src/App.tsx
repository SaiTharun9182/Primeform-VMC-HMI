import { useEffect, useMemo, useState } from "react";
import {
  confirmMachineCheck,
  confirmTool,
  confirmWorkpiece,
  getHmiSession,
  login,
  nextStage,
  startOperation,
  stopOperation,
  resetHmiSession,
  type HmiSession,
} from "./api";
import "./App.css";


type AppScreen = "LOGIN" | "HMI";

const TOKEN_KEY = "primeform_hmi_token";

function App() {
  const [screen, setScreen] = useState<AppScreen>("LOGIN");
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );
  const [session, setSession] = useState<HmiSession | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setScreen("LOGIN");
      return;
    }

    setLoading(true);

    getHmiSession(token)
      .then((data) => {
        setSession(data);
        setScreen("HMI");
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setSession(null);
        setScreen("LOGIN");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setError("");
      setLoading(true);

      const response = await login(username, password);

      localStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);

      const hmiData = await getHmiSession(response.token);

      setSession(hmiData);
      setScreen("HMI");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    if (!token) {
      return;
    }

    const data = await getHmiSession(token);
    setSession(data);
  };

  const handleNext = async () => {
    if (!token) {
      return;
    }

    try {
      setError("");
      setLoading(true);
      await nextStage(token);
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMachineCheck = async (id: number) => {
    if (!token) {
      return;
    }

    try {
      setError("");
      setLoading(true);
      await confirmMachineCheck(token, id);
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm check");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTool = async (id: number) => {
    if (!token) {
      return;
    }

    try {
      setError("");
      setLoading(true);
      await confirmTool(token, id);
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm tool");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWorkpiece = async () => {
    if (!token) {
      return;
    }

    try {
      setError("");
      setLoading(true);
      await confirmWorkpiece(token);
      await refreshSession();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to confirm workpiece setup"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!token) {
      return;
    }

    try {
      setError("");
      setLoading(true);
      await startOperation(token);
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start operation");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!token) {
      return;
    }

    try {
      setError("");
      setLoading(true);
      await stopOperation(token);
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to stop operation");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setSession(null);
    setScreen("LOGIN");
  };

  const handleResetDemo = async () => {
  if (!token) {
    return;
  }

  try {
    setError("");
    setLoading(true);

    await resetHmiSession(token);
    await refreshSession();
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to reset demo session"
    );
  } finally {
    setLoading(false);
  }
};

  const progress = useMemo(() => {
    if (!session) {
      return 0;
    }

    switch (session.session.currentStage) {
      case "POWER_ON":
        return 0;
      case "MACHINE_CHECKS":
        return 20;
      case "TOOLS":
        return 40;
      case "WORKPIECE":
        return 60;
      case "READY":
        return 80;
      case "OPERATION":
        return 100;
      default:
        return 0;
    }
  }, [session]);

  if (screen === "LOGIN") {
    return (
      <div className="app-shell login-shell">
        <div className="login-card">
          <div className="brand-mark">PF</div>

          <div className="eyebrow">PRIMEFORM LABS</div>

          <h1>VMC Operator HMI</h1>

          <p className="login-description">
            Sign in to access the VMC startup guidance interface.
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="password">Password</label>
            <div className="password-field">
  <input
    id="password"
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(event) => setPassword(event.target.value)}
    autoComplete="current-password"
    required
  />

  <button
    type="button"
    className="password-toggle"
    onClick={() => setShowPassword((current) => !current)}
    aria-label={showPassword ? "Hide password" : "Show password"}
    title={showPassword ? "Hide password" : "Show password"}
  >
    {showPassword ? (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
) : (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M3 3l18 18" />
    <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.5 0 10 6 10 6a17.2 17.2 0 0 1-3.1 3.7" />
    <path d="M6.2 6.8C3.8 8.2 2 12 2 12s3.5 6 10 6a9.8 9.8 0 0 0 3.1-.5" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
)}
  </button>
</div>
            {error && <div className="error-message">{error}</div>}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !session) {
    return (
      <div className="app-shell">
        <div className="loading-state">Loading HMI...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const { currentStage, operationStatus } = session.session;

  const confirmedChecks = session.machineChecks.filter(
    (check) => check.confirmed
  ).length;

  const confirmedTools = session.requiredTools.filter(
    (tool) => tool.confirmed
  ).length;

  return (
    <div className="app-shell hmi-shell">
      <header className="top-bar">
        <div>
          <div className="brand-title">PRIMEFORM</div>
          <div className="brand-subtitle">VMC OPERATOR HMI</div>
        </div>

        <div className="machine-status">
  <span className="status-dot" />
  <span>VMC-01</span>
  <strong>POWER ON</strong>
</div>

<details className="top-menu">
  <summary aria-label="Open HMI options">⋮</summary>

  <div className="top-menu-panel">
    <button onClick={handleResetDemo} disabled={loading}>
      Restart Machine Startup Demo
    </button>

    <button onClick={handleLogout}>
      Logout
    </button>
  </div>
</details>
      </header>

      <main className="hmi-content">
        <div className="progress-area">
          <div className="progress-label">
            <span>STARTUP PROGRESS</span>
            <span>{progress}%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {error && <div className="error-message global-error">{error}</div>}

        {currentStage === "POWER_ON" && (
          <section className="stage-card">
            <div className="stage-number">START</div>

            <div className="stage-heading">
              <span className="stage-kicker">VMC STARTUP</span>
              <h1>Power On</h1>
              <p>
                Machine power and control are available. Begin the startup
                checks before loading tooling.
              </p>
            </div>

            <div className="machine-summary">
              <div>
                <span>Machine</span>
                <strong>VMC-01</strong>
              </div>
              <div>
                <span>Operation</span>
                <strong>{session.production.operation_name}</strong>
              </div>
              <div>
                <span>Program</span>
                <strong>{session.production.cnc_program}</strong>
              </div>
            </div>

            <div className="action-row">
              <button
                className="primary-button large-button"
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? "PLEASE WAIT..." : "BEGIN MACHINE CHECKS"}
              </button>
            </div>
          </section>
        )}

        {currentStage === "MACHINE_CHECKS" && (
          <section className="stage-card">
            <div className="stage-number">01 / 05</div>

            <div className="stage-heading">
              <span className="stage-kicker">CURRENT INSTRUCTION</span>
              <h1>Machine Checks</h1>
              <p>
                Confirm every machine condition before proceeding to tooling.
              </p>
            </div>

            <div className="counter-card">
              <span>CHECKS CONFIRMED</span>
              <strong>
                {confirmedChecks} / {session.machineChecks.length}
              </strong>
            </div>

            <div className="check-list">
              {session.machineChecks.map((check) => (
                <div
                  className={`check-item ${
                    check.confirmed ? "confirmed" : ""
                  }`}
                  key={check.id}
                >
                  <div className="check-index">
                    {String(check.check_order).padStart(2, "0")}
                  </div>

                  <div className="check-content">
                    <h2>{check.name}</h2>
                    <p>{check.instruction}</p>
                  </div>

                  <button
                    className={
                      check.confirmed
                        ? "confirm-button confirmed-button"
                        : "confirm-button"
                    }
                    onClick={() => handleConfirmMachineCheck(check.id)}
                    disabled={check.confirmed || loading}
                  >
                    {check.confirmed ? "CONFIRMED" : "CONFIRM CHECK"}
                  </button>
                </div>
              ))}
            </div>

            <div className="action-row">
              <button
                className="secondary-button large-button"
                onClick={handleNext}
                disabled={
                  loading || confirmedChecks !== session.machineChecks.length
                }
              >
                NEXT
              </button>
            </div>
          </section>
        )}

        {currentStage === "TOOLS" && (
          <section className="stage-card">
            <div className="stage-number">02 / 05</div>

            <div className="stage-heading">
              <span className="stage-kicker">CURRENT INSTRUCTION</span>
              <h1>Required Tools</h1>
              <p>
                Insert and confirm every tool required for the CNC program.
              </p>
            </div>

            <div className="counter-card">
              <span>TOOLS CONFIRMED</span>
              <strong>
                {confirmedTools} / {session.requiredTools.length}
              </strong>
            </div>

            <div className="tool-list">
              {session.requiredTools.map((tool) => (
                <div
                  className={`tool-item ${tool.confirmed ? "confirmed" : ""}`}
                  key={tool.id}
                >
                  <div className="tool-number">{tool.tool_number}</div>

                  <div className="tool-content">
                    <h2>{tool.tool_type}</h2>
                    <p>Program revision: {tool.program_revision}</p>
                  </div>

                  <button
                    className={
                      tool.confirmed
                        ? "confirm-button confirmed-button"
                        : "confirm-button"
                    }
                    onClick={() => handleConfirmTool(tool.id)}
                    disabled={tool.confirmed || loading}
                  >
                    {tool.confirmed ? "CONFIRMED" : "CONFIRM TOOL"}
                  </button>
                </div>
              ))}
            </div>

            <div className="action-row">
              <button
                className="secondary-button large-button"
                onClick={handleNext}
                disabled={
                  loading || confirmedTools !== session.requiredTools.length
                }
              >
                NEXT
              </button>
            </div>
          </section>
        )}

        {currentStage === "WORKPIECE" && session.workpieceSetup && (
          <section className="stage-card">
            <div className="stage-number">03 / 05</div>

            <div className="stage-heading">
              <span className="stage-kicker">CURRENT INSTRUCTION</span>
              <h1>Workpiece Setup</h1>
              <p>Arrange, clamp and confirm the workpiece.</p>
            </div>

            <div className="setup-grid">
              <div className="info-card">
                <span>FIXTURE</span>
                <strong>{session.workpieceSetup.fixture}</strong>
              </div>

              <div className="info-card">
                <span>MATERIAL</span>
                <strong>{session.workpieceSetup.material}</strong>
              </div>

              <div className="info-card">
                <span>DRAWING</span>
                <strong>{session.workpieceSetup.drawing_revision}</strong>
              </div>

              <div className="info-card">
                <span>WORK OFFSET</span>
                <strong>{session.workpieceSetup.work_offset}</strong>
              </div>
            </div>

            <div className="instruction-panel">
              <span>ORIENTATION</span>
              <p>{session.workpieceSetup.orientation}</p>

              <span>CLAMPING INSTRUCTION</span>
              <p>{session.workpieceSetup.clamping_instruction}</p>
            </div>

            <div className="action-row">
              <button
                className={
                  session.workpieceSetup.confirmed
                    ? "primary-button large-button confirmed-main-button"
                    : "primary-button large-button"
                }
                onClick={handleConfirmWorkpiece}
                disabled={session.workpieceSetup.confirmed || loading}
              >
                {session.workpieceSetup.confirmed
                  ? "WORKPIECE CONFIRMED"
                  : "CONFIRM WORKPIECE"}
              </button>

              <button
                className="secondary-button large-button"
                onClick={handleNext}
                disabled={loading || !session.workpieceSetup.confirmed}
              >
                NEXT
              </button>
            </div>
          </section>
        )}

        {currentStage === "READY" && (
          <section className="stage-card ready-card">
            <div className="stage-number">04 / 05</div>

            <div className="ready-indicator">READY</div>

            <div className="stage-heading">
              <span className="stage-kicker">READY REVIEW</span>
              <h1>All setup checks complete</h1>
              <p>
                Machine checks, required tooling and workpiece setup have
                been confirmed.
              </p>
            </div>

            <div className="review-list">
              <div>
                <span>Machine checks</span>
                <strong>COMPLETE</strong>
              </div>
              <div>
                <span>Required tools</span>
                <strong>COMPLETE</strong>
              </div>
              <div>
                <span>Workpiece setup</span>
                <strong>COMPLETE</strong>
              </div>
            </div>

            <div className="action-row">
              <button
                className="primary-button large-button"
                onClick={handleNext}
                disabled={loading}
              >
                PROCEED TO OPERATION
              </button>
            </div>
          </section>
        )}

        {currentStage === "OPERATION" && (
          <section className="stage-card operation-card">
            <div className="stage-number">05 / 05</div>

            <div className="operation-status">
              <span>OPERATION STATUS</span>

              <strong className={`status-${operationStatus.toLowerCase()}`}>
                {operationStatus}
              </strong>
            </div>

            <div className="stage-heading">
              <span className="stage-kicker">CURRENT OPERATION</span>
              <h1>{session.production.operation_name}</h1>
              <p>
                {session.production.quantity} parts ·{" "}
                {session.production.material} ·{" "}
                {session.production.drawing_revision}
              </p>
            </div>

            <div className="operation-details">
              <div>
                <span>CNC PROGRAM</span>
                <strong>{session.production.cnc_program}</strong>
              </div>
              <div>
                <span>FIXTURE</span>
                <strong>{session.production.fixture}</strong>
              </div>
              <div>
                <span>WORK OFFSET</span>
                <strong>{session.production.work_offset}</strong>
              </div>
            </div>

            <div className="action-row">
              {operationStatus === "READY" && (
                <button
                  className="primary-button start-button"
                  onClick={handleStart}
                  disabled={loading}
                >
                  START OPERATION
                </button>
              )}

              {operationStatus === "RUNNING" && (
                <button
                  className="stop-button"
                  onClick={handleStop}
                  disabled={loading}
                >
                  STOP OPERATION
                </button>
              )}

              {operationStatus === "STOPPED" && (
                <div className="stopped-message">
                  <strong>OPERATION STOPPED</strong>
                  <span>The latest HMI stage has been preserved.</span>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="bottom-bar">
        <span>VMC-01</span>
        <span>Operator Startup Guidance</span>
        <span>{session.production.cnc_program}</span>
      </footer>
    </div>
  );

  
}

export default App;