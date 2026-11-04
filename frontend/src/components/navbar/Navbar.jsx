import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import "./Navbar-mobile.css";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"
).replace(/\/$/, "");

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  const navClass = ({ isActive }) =>
    isActive ? "navbar-link active" : "navbar-link";

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      // The backend deletes the SQLite session and clears its HttpOnly cookie.
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not log out. Please try again.");
      }

      closeMenu();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Could not log out. Check your connection and try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon" aria-hidden="true">
            ✈
          </span>
          <span>AirHacks</span>
        </Link>

        <button
          className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="airhacks-navbar-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          id="airhacks-navbar-menu"
          className={`navbar-menu ${menuOpen ? "menu-open" : ""}`}
        >
          <NavLink to="/" end className={navClass} onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink
            to="/search-flights"
            className={navClass}
            onClick={closeMenu}
          >
            Search Flights
          </NavLink>

          <NavLink to="/deals" className={navClass} onClick={closeMenu}>
            Flight Deals
          </NavLink>

          <Link
            to="/#about"
            className="navbar-link about-link"
            onClick={closeMenu}
          >
            About
          </Link>

          <Link
            to="/search-flights"
            className="navbar-cta"
            onClick={closeMenu}
          >
            Find a Flight <span aria-hidden="true">↗</span>
          </Link>

          <button
            type="button"
            className="navbar-logout"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-busy={loggingOut}
          >
            {loggingOut ? "Logging out…" : "Log Out"}
          </button>
        </div>
      </nav>

      {logoutError && (
        <div className="navbar-logout-error" role="alert">
          {logoutError}
        </div>
      )}
    </header>
  );
}

export default Navbar;
