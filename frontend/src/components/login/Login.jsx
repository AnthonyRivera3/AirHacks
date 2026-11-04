import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { startLogin, verifyLoginCode } from "./authApi";
import "./Login.css";
import "./Login-mobile.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState("password");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submitCredentials(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await startLogin(username.trim(), password);
      setChallengeId(result.challengeId);
      setMaskedEmail(result.maskedEmail);
      setPassword("");
      setCode("");
      setStep("code");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event) {
    event.preventDefault();
    if (busy || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setError("");
    try {
      await verifyLoginCode(challengeId, code);
      const destination = location.state?.from;
      navigate(typeof destination === "string" && destination.startsWith("/") && !destination.startsWith("//")
        ? destination : "/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    setStep("password");
    setChallengeId("");
    setMaskedEmail("");
    setCode("");
    setPassword("");
    setError("");
  }

  return (
    <main className="ah-login-page">
      <section className="ah-login-card" aria-labelledby="ah-login-title">
        <div className="ah-login-brand">
          <span className="ah-login-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M21 3 3 10.5l7.2 2.3 2.3 7.2L21 3Z" />
              <path d="m10.2 12.8 4.3-4.3" />
            </svg>
          </span>
          <span>AirHacks</span>
        </div>

        <div className="ah-login-heading">
          <span className="ah-login-eyebrow">PRIVATE ACCESS • INVITE ONLY</span>
          <h1 id="ah-login-title">
            {step === "password" ? "Welcome aboard." : "Check your email."}
          </h1>
          <p>{step === "password"
            ? "Enter your assigned username and password to sign in."
            : `We've emailed a six-digit sign-in code to ${maskedEmail}. It expires in 10 minutes.`}</p>
        </div>

        {error && <p className="ah-login-error" role="alert">{error}</p>}

        {step === "password" ? (
          <form className="ah-login-form" onSubmit={submitCredentials}>
            <div className="ah-login-field">
              <label htmlFor="ah-login-username">Username</label>
              <input id="ah-login-username" name="username" type="text"
                autoComplete="username" placeholder="Your AirHacks username"
                minLength={3} maxLength={40} required
                value={username} onChange={(event) => setUsername(event.target.value)} />
            </div>

            <div className="ah-login-field">
              <label htmlFor="ah-login-password">Password</label>
              <div className="ah-login-password-wrap">
                <input id="ah-login-password" name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password" placeholder="Enter your password"
                  required value={password}
                  onChange={(event) => setPassword(event.target.value)} />
                <button className="ah-login-show-password" type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button className="ah-login-submit" type="submit" disabled={busy}>
              {busy ? "Checking credentials..." : "Email my verification code"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        ) : (
          <form className="ah-login-form" onSubmit={submitCode}>
            <div className="ah-login-field">
              <label htmlFor="ah-login-code">6-digit verification code</label>
              <input className="ah-login-code-input" id="ah-login-code"
                name="one-time-code" type="text" inputMode="numeric"
                autoComplete="one-time-code" pattern="[0-9]{6}"
                placeholder="000000" maxLength={6} required autoFocus
                value={code} onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
              <span className="ah-login-helper">Code is valid for 10 minutes and five attempts.</span>
            </div>
            <button className="ah-login-submit" type="submit"
              disabled={busy || code.length !== 6}>
              {busy ? "Verifying..." : "Verify and enter AirHacks"}
              <span aria-hidden="true">→</span>
            </button>
            <button className="ah-login-back" type="button" onClick={startOver} disabled={busy}>
              Use another account or request a new code
            </button>
          </form>
        )}

        <p className="ah-login-demo-note">
          Accounts are created by the AirHacks administrator. There is no public registration.
        </p>
      </section>
      <p className="ah-login-footer">
        AIRHACKS <span aria-hidden="true">✦</span> FIND YOUR NEXT DESTINATION
      </p>
    </main>
  );
}
