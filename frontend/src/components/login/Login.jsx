import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import "./Login-mobile.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    // Frontend-only demo. Add an authentication request here later.
    // Never treat this as proof that the user is authenticated.
    navigate("/", { replace: true });
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
          <span className="ah-login-eyebrow">YOUR NEXT ADVENTURE AWAITS</span>
          <h1 id="ah-login-title">Welcome aboard.</h1>
          <p>Sign in to explore flights, discover deals, and plan your next trip.</p>
        </div>

        <form className="ah-login-form" onSubmit={handleSubmit}>
          <div className="ah-login-field">
            <label htmlFor="ah-login-email">Email address</label>
            <input
              id="ah-login-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="ah-login-field">
            <label htmlFor="ah-login-password">Password</label>
            <div className="ah-login-password-wrap">
              <input
                id="ah-login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="ah-login-show-password"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button className="ah-login-submit" type="submit">
            Continue to AirHacks <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="ah-login-demo-note">
          Demo login: any valid email and nonempty password will open the homepage.
          Accounts and password verification are not connected yet.
        </p>
      </section>

      <p className="ah-login-footer">AIRHACKS <span aria-hidden="true">✦</span> FIND YOUR NEXT DESTINATION</p>
    </main>
  );
}
