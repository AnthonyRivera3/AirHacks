
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Navbar.css";
import "./Navbar-mobile.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const navClass = ({ isActive }) =>
    isActive ? "navbar-link active" : "navbar-link";

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
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`navbar-menu ${menuOpen ? "menu-open" : ""}`}>
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
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
