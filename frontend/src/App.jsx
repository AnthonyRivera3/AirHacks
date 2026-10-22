
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./App.css";

function Navbar() {
  return (
    <header className="navbar">
      <Link className="logo" to="/">
        <span className="logo-mark">✈</span>
        <span>Air<span className="logo-accent">Hacks</span></span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/flights">Find Flights</NavLink>
        <NavLink to="/saved">Saved Deals</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>

      <Link className="nav-cta" to="/flights">Explore flights <span>↗</span></Link>
    </header>
  );
}

function Home() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState("round-trip");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travelers, setTravelers] = useState("1");

  function handleSearch(event) {
    event.preventDefault();

    if (!origin.trim() || !destination.trim() || !departDate) {
      return;
    }

    if (tripType === "round-trip" && returnDate && returnDate < departDate) {
      alert("Return date must be on or after your departure date.");
      return;
    }

    navigate("/flights", {
      state: {
        tripType,
        origin: origin.trim(),
        destination: destination.trim(),
        departDate,
        returnDate: tripType === "round-trip" ? returnDate : "",
        travelers,
      },
    });
  }

  return (
    <>
      <section className="home-hero">
        <div className="hero-photo" />
        <div className="hero-shade" />

        <div className="hero-inner">
          <div className="eyebrow"><span /> YOUR JOURNEY STARTS HERE</div>
          <h1>There's a whole<br />world <em>out there.</em></h1>
          <p>
            Find flights worth getting excited about.
            Compare your options and get one step closer to your next adventure.
          </p>
          <a className="hero-link" href="#flight-search">
            Find your next flight <span>↓</span>
          </a>
        </div>

        <div className="hero-caption">
          <span>GO SOMEWHERE NEW</span>
          <span>THE WORLD IS YOURS TO EXPLORE</span>
        </div>
      </section>

      <section className="search-section" id="flight-search">
        <div className="section-heading">
          <div>
            <span className="eyebrow blue-eyebrow">START EXPLORING</span>
            <h2>Where will you go next?</h2>
          </div>
          <span className="heading-plane">✈</span>
        </div>

        <form className="search-card" onSubmit={handleSearch}>
          <div className="trip-tabs">
            <button
              type="button"
              className={tripType === "round-trip" ? "trip-tab selected" : "trip-tab"}
              onClick={() => setTripType("round-trip")}
            >
              ⇄ Round trip
            </button>
            <button
              type="button"
              className={tripType === "one-way" ? "trip-tab selected" : "trip-tab"}
              onClick={() => setTripType("one-way")}
            >
              → One way
            </button>
          </div>

          <div className="search-grid">
            <label className="field">
              <span>FROM</span>
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="City or airport"
                required
              />
            </label>

            <label className="field">
              <span>TO</span>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Your destination"
                required
              />
            </label>

            <label className="field">
              <span>DEPARTURE</span>
              <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </label>

            {tripType === "round-trip" && (
              <label className="field">
                <span>RETURN</span>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departDate || new Date().toISOString().split("T")[0]}
                />
              </label>
            )}

            <label className="field">
              <span>TRAVELERS</span>
              <select value={travelers} onChange={(e) => setTravelers(e.target.value)}>
                <option value="1">1 traveler</option>
                <option value="2">2 travelers</option>
                <option value="3">3 travelers</option>
                <option value="4">4 travelers</option>
                <option value="5">5 travelers</option>
                <option value="6">6 travelers</option>
              </select>
            </label>
          </div>

          <div className="search-actions">
            <span><span className="live-dot" /> Your next adventure awaits</span>
            <button className="primary-button" type="submit">
              Search flights <span>→</span>
            </button>
          </div>
        </form>
      </section>

      <section className="intro-section">
        <div>
          <span className="eyebrow blue-eyebrow">LESS PLANNING, MORE EXPLORING</span>
          <h2>Make getting there<br />part of the adventure.</h2>
        </div>
        <p>
          AirHacks helps you explore flight options in one place.
          Search your route, compare fares, and keep track of flights
          you want to come back to.
        </p>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <span className="feature-icon">⌕</span>
          <h3>Search your way</h3>
          <p>Start with your destination, dates, and travel plans.</p>
        </article>
        <article className="feature-card">
          <span className="feature-icon">↕</span>
          <h3>Compare flights</h3>
          <p>Explore options and sort them to suit your priorities.</p>
        </article>
        <article className="feature-card">
          <span className="feature-icon">♡</span>
          <h3>Save your favorites</h3>
          <p>Keep the flights you're considering close at hand.</p>
        </article>
      </section>
    </>
  );
}

function Flights() {
  const { state } = useLocation();

  return (
    <main className="inner-page">
      <span className="eyebrow blue-eyebrow">FLIGHT EXPLORER</span>
      <h1>Find your flight.</h1>
      <p className="page-lead">Your search, your next adventure.</p>

      {state?.origin && state?.destination ? (
        <div className="route-summary">
          <div>
            <span className="summary-label">YOUR ROUTE</span>
            <h2>{state.origin} <span>→</span> {state.destination}</h2>
            <p>
              {state.departDate}
              {state.tripType === "round-trip" && state.returnDate
                ? ` · Return ${state.returnDate}`
                : " · One way"}
              {" · "}{state.travelers} traveler(s)
            </p>
          </div>
          <Link className="secondary-button" to="/">Edit search</Link>
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-plane">✈</span>
          <h2>Where would you like to go?</h2>
          <p>Start a search to explore flight options for your next trip.</p>
          <Link className="primary-button link-button" to="/">Search flights <span>→</span></Link>
        </div>
      )}

      <div className="results-placeholder">
        <span className="section-label">YOUR RESULTS</span>
        <h2>Flight options will appear here</h2>
        <p>
          This page is ready for live flight data, price sorting,
          airline filters, and departure-time filters.
        </p>
      </div>
    </main>
  );
}

function SavedDeals() {
  return (
    <main className="inner-page">
      <span className="eyebrow blue-eyebrow">YOUR TRAVEL SHORTLIST</span>
      <h1>Saved deals.</h1>
      <p className="page-lead">Keep the flights you love in one place.</p>

      <div className="empty-state">
        <span className="empty-plane">♡</span>
        <h2>Your favorites will live here.</h2>
        <p>Once flight results and saving are connected, you can revisit your favorite options here.</p>
        <Link className="primary-button link-button" to="/flights">Explore flights <span>→</span></Link>
      </div>
    </main>
  );
}

function About() {
  return (
    <main className="inner-page">
      <span className="eyebrow blue-eyebrow">ABOUT AIRHACKS</span>
      <h1>Travel should feel exciting.</h1>
      <p className="page-lead">
        We're building a simpler way to discover flights and plan what's next.
      </p>

      <div className="about-panel">
        <h2>One search. More possibilities.</h2>
        <p>
          AirHacks is a flight-search project designed to help travelers
          explore routes, compare flight options, and save interesting deals.
          Flight availability and pricing will be provided by the flight data
          API connected to the app.
        </p>
        <Link className="primary-button link-button" to="/">Start exploring <span>→</span></Link>
      </div>
    </main>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <Link className="logo footer-logo" to="/">
        <span className="logo-mark">✈</span>
        <span>Air<span className="logo-accent">Hacks</span></span>
      </Link>
      <span className="footer-note">MADE FOR THE LOVE OF GOING PLACES.</span>
      <Link to="/about">About AirHacks ↗</Link>
    </footer>
  );
}

function SiteLayout() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/saved" element={<SavedDeals />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<main className="inner-page"><h1>Page not found</h1><Link to="/">Back home</Link></main>} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteLayout />
    </BrowserRouter>
  );
}
