
import { useState } from "react";
import "./App.css";

function App() {
  const [tripType, setTripType] = useState("round-trip");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travelers, setTravelers] = useState("1 traveler");

  function handleSearch(event) {
    event.preventDefault();

    if (!origin.trim() || !destination.trim() || !departDate) {
      alert("Please enter your origin, destination, and departure date.");
      return;
    }

    alert("Homepage search UI is working! We'll connect real flight data next.");
  }

  return (
    <main className="app-shell">
      <div className="background-grid" />
      <div className="orb orb-one" />
      <div className="orb orb-two" />

      <nav className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">✈</span>
          <span>AIR<span className="brand-accent">HACKS</span></span>
        </a>

        <div className="nav-links">
          <a href="#search">Find flights</a>
          <a href="#how-it-works">How it works</a>
          <a href="#saved">Saved deals</a>
        </div>

        <a className="nav-status" href="#search">
          <span className="status-dot" />
          SYSTEM ONLINE
        </a>
      </nav>

      <section className="hero" id="home">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            YOUR NEXT FLIGHT STARTS HERE
          </div>

          <h1>
            HUNT DOWN
            <br />
            <span className="gradient-text">FLIGHT DEALS.</span>
          </h1>

          <p className="hero-description">
            Less scrolling. Smarter searching. Find your next adventure
            without letting expensive airfare ground your plans.
          </p>

          <div className="hero-points">
            <span><span className="check">✓</span> Compare flight options</span>
            <span><span className="check">✓</span> Find your best fare</span>
          </div>
        </div>

        <div className="flight-visual" aria-hidden="true">
          <div className="radar radar-outer" />
          <div className="radar radar-middle" />
          <div className="radar radar-inner" />
          <div className="radar-cross horizontal" />
          <div className="radar-cross vertical" />
          <div className="radar-sweep" />
          <span className="radar-plane">✈</span>
          <span className="radar-point point-one" />
          <span className="radar-point point-two" />
          <span className="radar-point point-three" />
          <div className="radar-label label-top">FLIGHT SCANNER</div>
          <div className="radar-label label-bottom">SEARCH YOUR NEXT DESTINATION</div>
        </div>
      </section>

      <section className="search-section" id="search">
        <div className="section-heading">
          <div>
            <span className="section-kicker">01 / FLIGHT SEARCH</span>
            <h2>Where are we going?</h2>
          </div>
          <span className="secure-label">⌁ SEARCH CONSOLE</span>
        </div>

        <form className="search-panel" onSubmit={handleSearch}>
          <div className="trip-tabs">
            <button
              type="button"
              className={tripType === "round-trip" ? "trip-tab active" : "trip-tab"}
              onClick={() => setTripType("round-trip")}
            >
              ⇄ Round trip
            </button>
            <button
              type="button"
              className={tripType === "one-way" ? "trip-tab active" : "trip-tab"}
              onClick={() => setTripType("one-way")}
            >
              → One way
            </button>
          </div>

          <div className="search-fields">
            <label className="field">
              <span className="field-label">FROM</span>
              <span className="field-icon">⌖</span>
              <input
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                placeholder="Origin city or airport"
                aria-label="Origin city or airport"
              />
            </label>

            <div className="route-divider" aria-hidden="true">⇄</div>

            <label className="field">
              <span className="field-label">TO</span>
              <span className="field-icon">⌖</span>
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Destination city or airport"
                aria-label="Destination city or airport"
              />
            </label>

            <label className="field">
              <span className="field-label">DEPARTURE</span>
              <span className="field-icon">▦</span>
              <input
                type="date"
                value={departDate}
                onChange={(event) => setDepartDate(event.target.value)}
                aria-label="Departure date"
                required
              />
            </label>

            {tripType === "round-trip" && (
              <label className="field">
                <span className="field-label">RETURN</span>
                <span className="field-icon">▦</span>
                <input
                  type="date"
                  value={returnDate}
                  min={departDate || undefined}
                  onChange={(event) => setReturnDate(event.target.value)}
                  aria-label="Return date"
                />
              </label>
            )}

            <label className="field travelers-field">
              <span className="field-label">TRAVELERS</span>
              <span className="field-icon">♙</span>
              <select
                value={travelers}
                onChange={(event) => setTravelers(event.target.value)}
                aria-label="Number of travelers"
              >
                <option>1 traveler</option>
                <option>2 travelers</option>
                <option>3 travelers</option>
                <option>4 travelers</option>
                <option>5+ travelers</option>
              </select>
            </label>
          </div>

          <div className="search-footer">
            <p><span className="status-dot" /> READY WHEN YOU ARE</p>
            <button className="search-button" type="submit">
              SEARCH FLIGHTS <span>↗</span>
            </button>
          </div>
        </form>
      </section>

      <section className="feature-section" id="how-it-works">
        <div className="feature-card">
          <span className="feature-number">01</span>
          <span className="feature-icon">⌕</span>
          <h3>Search smarter</h3>
          <p>Start with your route, dates, and travel plans.</p>
        </div>

        <div className="feature-card">
          <span className="feature-number">02</span>
          <span className="feature-icon">↕</span>
          <h3>Compare options</h3>
          <p>We'll build filters for price, airline, and timing.</p>
        </div>

        <div className="feature-card" id="saved">
          <span className="feature-number">03</span>
          <span className="feature-icon">♡</span>
          <h3>Save your finds</h3>
          <p>Keep track of flights you want to revisit.</p>
        </div>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">✈</span>
          <span>AIR<span className="brand-accent">HACKS</span></span>
        </a>
        <span>BUILT TO FIND YOUR NEXT ADVENTURE.</span>
        <span className="footer-version">AIRHACKS / V1.0</span>
      </footer>
    </main>
  );
}

export default App;
