import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import "./Home-mobile.css";

const flights = [
  { code: "AH204", from: "JFK", to: "LHR", altitude: "36,000 ft", speed: "520 kts", status: "EN ROUTE" },
  { code: "AH817", from: "LAX", to: "CDG", altitude: "34,000 ft", speed: "501 kts", status: "EN ROUTE" },
  { code: "AH326", from: "ORD", to: "FRA", altitude: "37,000 ft", speed: "540 kts", status: "EN ROUTE" },
  { code: "AH591", from: "SIN", to: "NRT", altitude: "38,000 ft", speed: "530 kts", status: "EN ROUTE" },
];

const routes = [
  { id: "route-one", d: "M 80 250 C 165 65, 300 75, 380 170" },
  { id: "route-two", d: "M 110 365 C 210 480, 360 420, 430 300" },
  { id: "route-three", d: "M 150 145 C 260 230, 300 325, 450 390" },
  { id: "route-four", d: "M 45 300 C 170 360, 250 170, 400 115" },
];

function Plane({ className = "" }) {
  return (
    <svg
      className={`network-plane ${className}`}
      viewBox="0 0 64 64"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M58 7 39 57l-8-19-18 10 5-18L4 20l54-13ZM31 38l10 5-4 8-6-13Z" />
    </svg>
  );
}

function FlightGlobe() {
  return (
    <div className="flight-visual" aria-label="Animated flight network illustration">
      <div className="network-grid" />
      <div className="radar-sweep" />

      <div className="globe-wrap">
        <div className="globe">
          <div className="globe-latitudes" />
          <div className="globe-longitudes" />
          <div className="continent continent-americas" />
          <div className="continent continent-europe" />
          <div className="continent continent-asia" />
          <div className="globe-shine" />
        </div>

        <svg
          className="route-map"
          viewBox="0 0 500 500"
          preserveAspectRatio="xMidYMid meet"
          role="presentation"
        >
          <defs>
            <filter id="route-glow">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {routes.map((route, index) => (
            <g key={route.id} className={`route-group route-group-${index + 1}`}>
              <path d={route.d} className="route-base" />
              <path d={route.d} className="route-dashes" />

              <circle className="airport-node" r="4">
                <animateMotion
                  dur={`${7 + index * 2}s`}
                  repeatCount="indefinite"
                  path={route.d}
                />
              </circle>

              <g className={`moving-plane moving-plane-${index + 1}`}>
                <Plane />
                <animateMotion
                  dur={`${10 + index * 2}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                  path={route.d}
                />
              </g>

              <circle
                className="airport-node"
                cx={index === 0 ? 380 : index === 1 ? 430 : index === 2 ? 450 : 400}
                cy={index === 0 ? 170 : index === 1 ? 300 : index === 2 ? 390 : 115}
                r="2.5"
              />
            </g>
          ))}

          <circle cx="80" cy="250" r="6" className="hub-node" />
          <circle cx="380" cy="170" r="6" className="hub-node" />
          <circle cx="430" cy="300" r="5" className="hub-node" />
        </svg>
      </div>

      <div className="hud-label hud-label-jfk">
        <span className="hud-dot" />JFK
        <small>NEW YORK</small>
      </div>

      <div className="hud-label hud-label-lhr">
        LHR
        <small>LONDON</small>
        <span className="hud-dot" />
      </div>

      <div className="hud-label hud-label-dxb">
        DXB
        <small>DUBAI</small>
      </div>

      <div className="hud-panel traffic-panel">
        <div className="hud-panel-title">
          <span className="status-light" /> NETWORK STATUS
        </div>
        <div className="metric">
          <span>TRACKED ROUTES</span>
          <strong>04</strong>
        </div>
        <div className="metric">
          <span>NETWORK MODE</span>
          <strong>SIMULATION</strong>
        </div>
        <div className="metric">
          <span>LINK STATUS</span>
          <strong className="cyan">ONLINE</strong>
        </div>
      </div>

      <div className="coordinates">
        40.7128° N
        <br />
        74.0060° W <span>/ AIRSPACE NODE</span>
      </div>
    </div>
  );
}

function Home() {
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-scanline" aria-hidden="true" />

        <div className="hero-copy">
          <p className="home-eyebrow">
            <span className="eyebrow-chevron">&gt;_</span> GLOBAL FLIGHT NETWORK
            <span className="divider-slash">//</span> LIVE
            <span className="live-pulse" />
          </p>

          <h1>
            Hack Your Way to <span>More Destinations.</span>
          </h1>

          <p className="home-description">
            Real flight discovery. Smarter searches. Better deals.
            <br className="desktop-break" /> Explore the world — faster, smarter,
            and easier.
          </p>

          <div className="hero-actions">
            <Link to="/search-flights" className="home-cta">
              Explore Flights <span aria-hidden="true">↗</span>
            </Link>
            <span className="hero-hint">[ INITIATE ROUTE SEARCH ]</span>
          </div>

          <div className="flight-table-panel">
            <div className="table-panel-heading">
              <span>
                FLIGHT FEED <i>/ DEMO DATA</i>
              </span>
              <span className="feed-status">
                <span className="status-light" /> STREAM ACTIVE
              </span>
            </div>

            <div className="flight-table-scroll">
              <table className="flight-table">
                <thead>
                  <tr>
                    <th>FLIGHT</th>
                    <th>FROM → TO</th>
                    <th>ALTITUDE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map((flight) => (
                    <tr key={flight.code}>
                      <td>{flight.code}</td>
                      <td>
                        {flight.from} <span className="table-arrow">→</span>{" "}
                        {flight.to}
                      </td>
                      <td>{flight.altitude}</td>
                      <td>
                        <span className="flight-status">{flight.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <FlightGlobe />

        <div className="hero-corner-code">
          AH // SYS.01
          <br />
          FLIGHT NETWORK VISUALIZER
          <br />
          <span>
            {clock.toLocaleTimeString([], { hour12: false })} UTC*
          </span>
        </div>
      </section>

      <section className="home-features" aria-label="AirHacks features">
        <article className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <circle cx="21" cy="21" r="13" />
              <path d="m31 31 10 10" />
              <path d="M9 21h24M21 9v24" strokeDasharray="2 4" />
            </svg>
          </div>
          <p className="feature-index">MODULE_01</p>
          <h2>Live Flight Network</h2>
          <p>
            Watch aircraft move through a connected world of routes and
            destinations.
          </p>
          <span className="feature-link">
            Explore network <span>↗</span>
          </span>
        </article>

        <article className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <circle cx="20" cy="20" r="12" />
              <path d="m29 29 10 10" />
              <path d="M14 20h12M20 14v12" />
            </svg>
          </div>
          <p className="feature-index">MODULE_02</p>
          <h2>Smarter Search</h2>
          <p>
            Compare flight options and narrow down your next route with useful
            filters.
          </p>
          <Link to="/search-flights" className="feature-link">
            Search flights <span>↗</span>
          </Link>
        </article>

        <article className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path d="M8 17 28 7l13 13-20 21L8 17Z" />
              <circle cx="29" cy="17" r="3" />
              <path d="m14 25 8 8" />
            </svg>
          </div>
          <p className="feature-index">MODULE_03</p>
          <h2>Exclusive Deals</h2>
          <p>
            Find price opportunities and discover somewhere new for less.
          </p>
          <Link to="/deals" className="feature-link">
            View deals <span>↗</span>
          </Link>
        </article>

        <aside className="terminal-card">
          <div className="terminal-top">
            <span>TERMINAL / AIRHACKS</span>
            <span className="terminal-lights">● ● ●</span>
          </div>
          <p>
            <span>&gt;</span> booting flight-network...
          </p>
          <p>
            <span>&gt;</span> mapping global routes <b>[OK]</b>
          </p>
          <p>
            <span>&gt;</span> loading search modules <b>[OK]</b>
          </p>
          <p>
            <span>&gt;</span> ready for takeoff
            <span className="terminal-cursor">_</span>
          </p>
          <div className="terminal-footer">
            // BETTER FLIGHTS. BIGGER ADVENTURES.
          </div>
        </aside>
      </section>

      <section id="about" className="home-about">
        <p className="home-eyebrow">ABOUT THE PROJECT // AIRHACKS</p>
        <h2>Your next destination is only a search away.</h2>
        <p>
          AirHacks brings flight discovery, route exploration, and deal hunting
          into one focused interface.
        </p>
      </section>
    </div>
  );
}

export default Home;