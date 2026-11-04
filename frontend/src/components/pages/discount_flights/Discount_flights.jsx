
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import usAirports from "../search_flights/usAirports.json";
import "./Discount_flights.css";
import "./Discount_flights-mobile.css";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5001"
).replace(/\/$/, "");

function formatMoney(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "Date unavailable";
  }

  return new Date(`${value}T00:00:00Z`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }
  );
}

function formatStops(stops) {
  if (stops === 0) return "Nonstop";
  if (stops === 1) return "1 stop";
  if (Number.isInteger(stops)) return `${stops} stops`;
  return "Stops unavailable";
}

function DealCard({ deal }) {
  const hasSavings =
    deal.savingsPercentage !== null &&
    deal.savingsPercentage > 0;

  return (
    <article className="discount-deal-card">
      <div className="discount-deal-image">
        {deal.destinationImage ? (
          <img
            src={deal.destinationImage}
            alt={`View of ${deal.destination}`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="discount-deal-image-fallback">
            <span aria-hidden="true">✈</span>
          </div>
        )}

        {hasSavings && (
          <span className="discount-deal-badge">
            {Math.round(deal.savingsPercentage)}%
            below typical
          </span>
        )}
      </div>

      <div className="discount-deal-content">
        <div className="discount-deal-location">
          <div>
            <p className="discount-deal-country">
              {deal.country}
            </p>

            <h3>{deal.destination}</h3>
          </div>

          {deal.destinationCode && (
            <span className="discount-deal-airport-code">
              {deal.destinationCode}
            </span>
          )}
        </div>

        {deal.tagline && (
          <p className="discount-deal-description">
            {deal.tagline}
          </p>
        )}

        <div className="discount-deal-route">
          <span>{deal.originCode || "Origin"}</span>
          <span aria-hidden="true">✈</span>
          <span>
            {deal.destinationCode || deal.destination}
          </span>
        </div>

        <div className="discount-deal-details">
          <div>
            <span className="discount-deal-detail-label">
              Departure
            </span>
            <strong>{formatDate(deal.outboundDate)}</strong>
          </div>

          <div>
            <span className="discount-deal-detail-label">
              Return
            </span>
            <strong>
              {deal.isRoundTrip
                ? formatDate(deal.returnDate)
                : "One way"}
            </strong>
          </div>
        </div>

        <div className="discount-deal-details">
          <div>
            <span className="discount-deal-detail-label">
              Airline
            </span>
            <strong>{deal.airline}</strong>
          </div>

          <div>
            <span className="discount-deal-detail-label">
              Stops
            </span>
            <strong>{formatStops(deal.stops)}</strong>
          </div>
        </div>

        {deal.duration && (
          <p className="discount-deal-duration">
            Flight duration: {deal.duration}
          </p>
        )}

        <div className="discount-deal-price-box">
          <div className="discount-deal-price-header">
            <span>Deal price</span>

            <strong>{formatMoney(deal.price)}</strong>
          </div>

          {deal.typicalPrice != null && (
            <div className="discount-deal-typical">
              <span>Typical fare</span>
              <span>
                {formatMoney(deal.typicalPrice)}
              </span>
            </div>
          )}

          {hasSavings && deal.savingsAmount != null && (
            <p className="discount-deal-savings">
              Save about {formatMoney(deal.savingsAmount)}
              {" "}compared with the typical fare
            </p>
          )}
        </div>

        {deal.bookingUrl ? (
          <a
            className="discount-deal-button"
            href={deal.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View flight deal to ${deal.destination} on Google Flights`}
          >
            View Deal <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <p className="discount-deal-unavailable">
            Booking link currently unavailable.
          </p>
        )}
      </div>
    </article>
  );
}

function DiscountFlights() {
  // Default featured deals from New York (JFK).
  const [selectedState, setSelectedState] = useState("NY");
  const [selectedAirport, setSelectedAirport] =
    useState("JFK");

  const [activeOrigin, setActiveOrigin] = useState("JFK");
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  // Local sorting and filtering.
  const [sortBy, setSortBy] = useState("savings");
  const [nonstopOnly, setNonstopOnly] = useState(false);

  const controllerRef = useRef(null);

  const selectedStateData = useMemo(
    () =>
      usAirports.find(
        (state) => state.code === selectedState
      ),
    [selectedState]
  );

  const airports = selectedStateData?.airports || [];

  const loadDeals = useCallback(async (airportCode) => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError("");
    setDeals([]);

    try {
      const url =
        `${API_BASE}/api/flights/deals?origin=` +
        encodeURIComponent(airportCode);

      const response = await fetch(url, {
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load flight deals."
        );
      }

      if (!Array.isArray(data?.deals)) {
        throw new Error(
          "Unexpected flight deals response."
        );
      }

      if (controller.signal.aborted) return;

      setDeals(data.deals);
      setActiveOrigin(airportCode);
      setHasLoaded(true);
      setNonstopOnly(false);
    } catch (requestError) {
      if (controller.signal.aborted) return;

      setError(
        requestError.message ||
          "Flight deals are currently unavailable."
      );
      setHasLoaded(true);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDeals("JFK");

    return () => {
      controllerRef.current?.abort();
    };
  }, [loadDeals]);

  function handleStateChange(event) {
    setSelectedState(event.target.value);
    setSelectedAirport("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!selectedAirport) {
      setError("Select an airport to find deals.");
      return;
    }

    loadDeals(selectedAirport);
  }

  const visibleDeals = useMemo(() => {
    const results = deals.filter(
      (deal) => !nonstopOnly || deal.stops === 0
    );

    return [...results].sort((a, b) => {
      if (sortBy === "price") {
        return a.price - b.price;
      }

      // Highest savings percentage first.
      return (
        (b.savingsPercentage ?? -1) -
          (a.savingsPercentage ?? -1) ||
        a.price - b.price
      );
    });
  }, [deals, nonstopOnly, sortBy]);

  return (
    <main className="discount-flights-page">

      {/* =====================================
          HERO SECTION
      ===================================== */}

      <section className="discount-flights-hero">
        <div className="discount-flights-hero-content">
          <p className="discount-flights-eyebrow">
            <span aria-hidden="true">✈</span>
            TRAVEL FOR LESS
          </p>

          <h1>Flight Deals</h1>

          <p className="discount-flights-subtitle">
            Discover your next adventure with flight deals
            worth taking off for.
          </p>
        </div>
      </section>

      {/* =====================================
          DEPARTURE AIRPORT SELECTOR
      ===================================== */}

      <section className="discount-deals-search">
        <div className="discount-deals-search-header">
          <h2>Where are you coming from?</h2>

          <p>
            Choose your departure airport to discover
            discounted flights to destinations around
            the world.
          </p>
        </div>

        <form
          className="discount-deals-form"
          onSubmit={handleSubmit}
        >
          <label>
            <span>Departure state</span>

            <select
              value={selectedState}
              onChange={handleStateChange}
              required
            >
              <option value="">
                Select a state
              </option>

              {usAirports.map((state) => (
                <option
                  key={state.code}
                  value={state.code}
                  disabled={!state.airports.length}
                >
                  {state.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Departure airport</span>

            <select
              value={selectedAirport}
              onChange={(event) =>
                setSelectedAirport(event.target.value)
              }
              disabled={!selectedState || !airports.length}
              required
            >
              <option value="">
                Choose an airport
              </option>

              {airports.map((airport) => (
                <option
                  key={airport.code}
                  value={airport.code}
                >
                  {airport.city
                    ? `${airport.city} — `
                    : ""}
                  {airport.name} ({airport.code})
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={loading || !selectedAirport}
          >
            {loading ? "Finding Deals..." : "Find Deals"}
          </button>
        </form>
      </section>

      {/* =====================================
          DEAL RESULTS
      ===================================== */}

      <section
        className="discount-deals-results"
        aria-live="polite"
      >
        <div className="discount-deals-results-heading">
          <div>
            <p className="discount-deals-kicker">
              DISCOVER YOUR NEXT GETAWAY
            </p>

            <h2>Deals from {activeOrigin}</h2>

            <p>
              Real flight-deal listings for one adult,
              round-trip, economy, in USD.
            </p>
          </div>

          {deals.length > 0 && (
            <div className="discount-deals-count">
              {visibleDeals.length} deals
            </div>
          )}
        </div>

        {!loading && deals.length > 0 && (
          <div className="discount-deals-toolbar">
            <label>
              <span>Sort deals</span>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
              >
                <option value="savings">
                  Biggest savings first
                </option>
                <option value="price">
                  Lowest price first
                </option>
              </select>
            </label>

            <label className="discount-deals-checkbox">
              <input
                type="checkbox"
                checked={nonstopOnly}
                onChange={(event) =>
                  setNonstopOnly(event.target.checked)
                }
              />

              Nonstop flights only
            </label>
          </div>
        )}

        {loading && (
          <div
            className="discount-deals-status"
            role="status"
          >
            <div className="discount-deals-spinner" />

            <h3>Searching for flight deals...</h3>

            <p>
              Checking discounted fares and travel dates.
            </p>
          </div>
        )}

        {!loading && error && (
          <div
            className="discount-deals-status"
            role="alert"
          >
            <h3>We couldn't load flight deals.</h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                loadDeals(selectedAirport || activeOrigin)
              }
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          hasLoaded &&
          deals.length === 0 && (
            <div className="discount-deals-status">
              <h3>No deals found right now.</h3>

              <p>
                Try a different departure airport
                to discover more destinations.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          deals.length > 0 &&
          visibleDeals.length === 0 && (
            <div className="discount-deals-status">
              <h3>No nonstop deals found.</h3>

              <p>
                Try allowing connecting flights.
              </p>

              <button
                type="button"
                onClick={() => setNonstopOnly(false)}
              >
                Show all deals
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          visibleDeals.length > 0 && (
            <div className="discount-deals-grid">
              {visibleDeals.map((deal, index) => (
                <DealCard
                  key={`${deal.id}-${index}`}
                  deal={deal}
                />
              ))}
            </div>
          )}

        {!loading && deals.length > 0 && (
          <p className="discount-deals-disclaimer">
            Savings compare the quoted fare with
            Google's estimated typical fare for
            similar trips. They are not guaranteed
            promotional discounts. Prices, availability,
            baggage fees, and booking conditions may
            change. Confirm the final fare on
            Google Flights.
          </p>
        )}
      </section>
    </main>
  );
}

export default DiscountFlights;
