
import { useMemo, useState } from "react";
import { useFlightSearch } from "./useFlightSearch";

import "./Search_flights.css";
import "./Search_flights-mobile.css";

// --------------------------
// Formatting helpers
// --------------------------

function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function displayTime(value) {
  if (
    typeof value !== "string" ||
    !/^\d{2}:\d{2}/.test(value)
  ) {
    return "--:--";
  }

  const hour = Number(value.slice(0, 2));

  return `${hour % 12 || 12}:${value.slice(3, 5)} ${
    hour >= 12 ? "PM" : "AM"
  }`;
}

function displayDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return "";
  }

  return new Date(`${value}T00:00:00Z`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }
  );
}

function displayDuration(minutes) {
  if (
    minutes == null ||
    !Number.isFinite(Number(minutes))
  ) {
    return "Duration unavailable";
  }

  const total = Number(minutes);

  return `${Math.floor(total / 60)}h ${Math.round(total % 60)}m`;
}

function displayPrice(amount) {
  if (
    amount == null ||
    !Number.isFinite(Number(amount))
  ) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}

function numericPrice(offer) {
  const value = offer?.total_amount;

  if (value == null || value === "") return null;

  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0
    ? amount
    : null;
}

function getOfferAirlines(offer) {
  return (offer.slices || []).flatMap((slice) =>
    (slice.segments || [])
      .map((flight) => flight.airline_name)
      .filter(
        (name) =>
          typeof name === "string" && name.trim()
      )
      .map((name) => name.trim())
  );
}

// --------------------------
// Flight route
// --------------------------

function FlightLeg({ slice, label }) {
  const flights = slice.segments || [];

  const airlineNames = [
    ...new Set(
      flights
        .map((flight) => flight.airline_name)
        .filter(Boolean)
    ),
  ];

  const flightNumbers = flights
    .map((flight) => flight.flight_number)
    .filter(Boolean);

  const stops = slice.stop_count;

  return (
    <div className="flight-leg">
      <p className="flight-leg-label">
        <strong>{label}</strong>
      </p>

      <div className="flight-result-route">
        <div>
          <strong>
            {displayTime(slice.departure?.time)}
          </strong>
          <span>{slice.departure?.code || "—"}</span>
          <small>
            {displayDate(slice.departure?.date)}
          </small>
        </div>

        <div className="flight-result-duration">
          <span>
            {stops == null
              ? "Stops unavailable"
              : stops === 0
                ? "Nonstop"
                : `${stops} ${
                    stops === 1 ? "stop" : "stops"
                  }`}
          </span>
          <span>
            {displayDuration(slice.duration_minutes)}
          </span>
        </div>

        <div>
          <strong>
            {displayTime(slice.arrival?.time)}
          </strong>
          <span>{slice.arrival?.code || "—"}</span>
          <small>
            {displayDate(slice.arrival?.date)}
          </small>
        </div>
      </div>

      {(airlineNames.length > 0 ||
        flightNumbers.length > 0) && (
        <p className="flight-results-message">
          {airlineNames.join(", ")}
          {flightNumbers.length > 0
            ? ` · ${flightNumbers.join(" / ")}`
            : ""}
        </p>
      )}
    </div>
  );
}

// --------------------------
// Booking providers
// --------------------------

function BookingOptions({ options }) {
  if (!options?.length) {
    return (
      <p>
        Booking links were not provided for this
        itinerary.
      </p>
    );
  }

  return (
    <div className="flight-booking-options">
      <strong>Compare booking providers</strong>

      {options.map((option, index) => (
        <div
          className="flight-booking-option"
          key={`${option.provider}-${index}`}
        >
          <p>
            {option.provider} ·{" "}
            {displayPrice(option.price)}
            {option.isSplit
              ? " · Separate tickets"
              : ""}
          </p>

          {option.isSplit ? (
            <div>
              <small>
                Outbound and return tickets must be
                booked separately.
              </small>

              <div>
                {option.departure?.bookingUrl ? (
                  <a
                    href={option.departure.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Book outbound with{" "}
                    {option.departure.provider}
                  </a>
                ) : (
                  <span>
                    Outbound booking link unavailable.
                  </span>
                )}
              </div>

              <div>
                {option.arrival?.bookingUrl ? (
                  <a
                    href={option.arrival.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Book return with{" "}
                    {option.arrival.provider}
                  </a>
                ) : (
                  <span>
                    Return booking link unavailable.
                  </span>
                )}
              </div>
            </div>
          ) : option.bookingUrl ? (
            <a
              href={option.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View fare at {option.provider}
            </a>
          ) : (
            <span>
              Direct booking link unavailable.
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// --------------------------
// Main search page
// --------------------------

export default function SearchFlights() {
  const [tripType, setTripType] =
    useState("round-trip");

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const [departureDate, setDepartureDate] =
    useState("");

  const [returnDate, setReturnDate] =
    useState("");

  const [adults, setAdults] = useState("1");

  const [cabinClass, setCabinClass] =
    useState("economy");

  const [lastSearch, setLastSearch] =
    useState(null);

  // New filter state
  const [selectedAirline, setSelectedAirline] =
    useState("all");

  const [maxPriceLimit, setMaxPriceLimit] =
    useState(null);

  const {
    offers,
    loading,
    error,
    searchFlights,
  } = useFlightSearch();

  // --------------------------
  // Build airline dropdown
  // from returned results
  // --------------------------

  const availableAirlines = useMemo(() => {
    const names = offers.flatMap(getOfferAirlines);

    return [...new Set(names)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [offers]);

  // --------------------------
  // Calculate price range
  // from returned results
  // --------------------------

  const priceRange = useMemo(() => {
    const prices = offers
      .map(numericPrice)
      .filter((price) => price !== null);

    if (prices.length === 0) return null;

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [offers]);

  // Start the slider at the highest price
  // so all flights display initially.

  const currentMaxPrice = priceRange
    ? maxPriceLimit === null
      ? priceRange.max
      : Math.min(
          priceRange.max,
          Math.max(priceRange.min, maxPriceLimit)
        )
    : 0;

  // --------------------------
  // Filter results locally
  // No additional API requests
  // --------------------------

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const airlines = getOfferAirlines(offer);

      const matchesAirline =
        selectedAirline === "all" ||
        airlines.some(
          (name) =>
            name.toLowerCase() ===
            selectedAirline.toLowerCase()
        );

      const price = numericPrice(offer);

      const matchesPrice =
        maxPriceLimit === null ||
        (price !== null &&
          price <= currentMaxPrice + 0.001);

      return matchesAirline && matchesPrice;
    });
  }, [
    offers,
    selectedAirline,
    maxPriceLimit,
    currentMaxPrice,
  ]);

  function resetFilters() {
    setSelectedAirline("all");
    setMaxPriceLimit(null);
  }

  // --------------------------
  // Flight search
  // --------------------------

  async function handleSearch(event) {
    event.preventDefault();

    const from = origin.trim().toUpperCase();
    const to = destination.trim().toUpperCase();

    if (
      !/^[A-Z]{3}$/.test(from) ||
      !/^[A-Z]{3}$/.test(to)
    ) {
      alert(
        "Enter a three-letter airport or city code."
      );
      return;
    }

    if (from === to) {
      alert(
        "Origin and destination must be different."
      );
      return;
    }

    if (
      !departureDate ||
      (tripType === "round-trip" &&
        (!returnDate || returnDate < departureDate))
    ) {
      alert(
        "Please enter valid departure and return dates."
      );
      return;
    }

    const search = {
      origin: from,
      destination: to,
      departureDate,

      ...(tripType === "round-trip"
        ? { returnDate }
        : {}),

      tripType,
      adults: Number(adults),
      cabinClass,
    };

    resetFilters();
    setLastSearch(search);

    await searchFlights(search);
  }

  async function retrySearch() {
    if (!lastSearch) return;

    resetFilters();
    await searchFlights(lastSearch);
  }

  return (
    <section className="search-flights-page">

      {/* Page heading */}

      <div className="search-flights-hero">
        <p className="search-flights-eyebrow">
          YOUR NEXT ADVENTURE STARTS HERE
        </p>

        <h1>Where will you go next?</h1>

        <p className="search-flights-intro">
          Find flights, compare options, and plan
          your next journey.
        </p>
      </div>

      {/* Search card */}

      <div className="search-flights-card">
        <div
          className="trip-type-options"
          aria-label="Trip type"
        >
          <button
            type="button"
            className={
              tripType === "round-trip"
                ? "trip-option selected"
                : "trip-option"
            }
            onClick={() => setTripType("round-trip")}
          >
            Round trip
          </button>

          <button
            type="button"
            className={
              tripType === "one-way"
                ? "trip-option selected"
                : "trip-option"
            }
            onClick={() => setTripType("one-way")}
          >
            One way
          </button>
        </div>

        <form
          className="flight-search-form"
          onSubmit={handleSearch}
        >
          <label className="flight-field">
            <span>From</span>

            <input
              type="text"
              placeholder="Airport code (JFK)"
              maxLength={3}
              value={origin}
              onChange={(event) =>
                setOrigin(event.target.value)
              }
              autoComplete="off"
              required
            />
          </label>

          <label className="flight-field">
            <span>To</span>

            <input
              type="text"
              placeholder="Airport code (LAX)"
              maxLength={3}
              value={destination}
              onChange={(event) =>
                setDestination(event.target.value)
              }
              autoComplete="off"
              required
            />
          </label>

          <label className="flight-field">
            <span>Departure</span>

            <input
              type="date"
              value={departureDate}
              min={todayLocal()}
              onChange={(event) =>
                setDepartureDate(event.target.value)
              }
              required
            />
          </label>

          {tripType === "round-trip" && (
            <label className="flight-field">
              <span>Return</span>

              <input
                type="date"
                value={returnDate}
                min={departureDate || todayLocal()}
                onChange={(event) =>
                  setReturnDate(event.target.value)
                }
                required
              />
            </label>
          )}

          <label className="flight-field passenger-field">
            <span>Adults</span>

            <select
              value={adults}
              onChange={(event) =>
                setAdults(event.target.value)
              }
            >
              {Array.from(
                { length: 8 },
                (_, index) => index + 1
              ).map((count) => (
                <option
                  key={count}
                  value={count}
                >
                  {count}{" "}
                  {count === 1 ? "adult" : "adults"}
                </option>
              ))}
            </select>
          </label>

          <label className="flight-field">
            <span>Cabin class</span>

            <select
              value={cabinClass}
              onChange={(event) =>
                setCabinClass(event.target.value)
              }
            >
              <option value="economy">
                Economy
              </option>

              <option value="premium_economy">
                Premium Economy
              </option>

              <option value="business">
                Business
              </option>

              <option value="first_class">
                First
              </option>
            </select>
          </label>

          <button
            className="flight-search-button"
            type="submit"
            disabled={loading}
          >
            <span aria-hidden="true">⌕</span>
            {loading ? "Searching..." : "Search Flights"}
          </button>
        </form>
      </div>

      {/* Results */}

      <div
        className="flight-results"
        aria-live="polite"
      >
        {loading && (
          <p className="flight-results-message">
            Searching for flights...
          </p>
        )}

        {!loading && error && (
          <div
            className="flight-results-error"
            role="alert"
          >
            <p>{error}</p>

            {lastSearch && (
              <button
                type="button"
                onClick={retrySearch}
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {/* Filters appear after flights load */}

        {!loading && !error && offers.length > 0 && (
          <>
            <div className="flight-results-heading">
              <div>
                <h2>Available Flights</h2>

                <p>
                  Showing {filteredOffers.length} of{" "}
                  {offers.length} flight options
                </p>
              </div>
            </div>

            <div className="flight-filters">
              <div className="flight-filters-heading">
                <div>
                  <h3>Filter flights</h3>

                  <p>
                    Narrow results by airline and budget.
                  </p>
                </div>

                <button
                  type="button"
                  className="flight-clear-filters"
                  onClick={resetFilters}
                >
                  Clear filters
                </button>
              </div>

              <div className="flight-filters-grid">

                {/* Airline dropdown */}

                <label className="flight-filter-field">
                  <span>Airline</span>

                  <select
                    value={selectedAirline}
                    onChange={(event) =>
                      setSelectedAirline(
                        event.target.value
                      )
                    }
                  >
                    <option value="all">
                      All airlines
                    </option>

                    {availableAirlines.map((airline) => (
                      <option
                        key={airline}
                        value={airline}
                      >
                        {airline}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Price slider */}

                {priceRange && (
                  <div className="flight-price-filter">
                    <div className="flight-price-filter-heading">
                      <label htmlFor="flight-max-price">
                        Maximum total price
                      </label>

                      <strong>
                        {displayPrice(currentMaxPrice)}
                      </strong>
                    </div>

                    <input
                      id="flight-max-price"
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      step="0.01"
                      value={currentMaxPrice}
                      disabled={
                        priceRange.min === priceRange.max
                      }
                      onChange={(event) =>
                        setMaxPriceLimit(
                          Number(event.target.value)
                        )
                      }
                    />

                    <div className="flight-price-range">
                      <span>
                        {displayPrice(priceRange.min)}
                      </span>

                      <span>
                        {displayPrice(priceRange.max)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="flight-results-message">
              Prices are USD totals for all selected
              adults. Flight times are local to each
              airport.
            </p>

            {/* Filtered flight cards */}

            {filteredOffers.length > 0 ? (
              <div className="flight-results-list">
                {filteredOffers.map((offer, index) => {
                  const firstFlight =
                    offer.slices?.[0]?.segments?.[0];

                  return (
                    <article
                      className="flight-result-card"
                      key={`${offer.id}-${index}`}
                    >
                      <div className="flight-result-airline">
                        {firstFlight?.airline_logo && (
                          <img
                            src={firstFlight.airline_logo}
                            alt=""
                            width="40"
                            height="40"
                          />
                        )}

                        <strong>
                          {firstFlight?.airline_name ||
                            "Airline details unavailable"}
                        </strong>
                      </div>

                      {offer.slices?.length ? (
                        offer.slices.map(
                          (slice, sliceIndex) => (
                            <FlightLeg
                              key={slice.id || sliceIndex}
                              slice={slice}
                              label={
                                sliceIndex === 0
                                  ? "Outbound"
                                  : "Return"
                              }
                            />
                          )
                        )
                      ) : (
                        <p>
                          Detailed flight legs unavailable.
                        </p>
                      )}

                      <div className="flight-result-price">
                        <strong>
                          From{" "}
                          {displayPrice(
                            offer.total_amount
                          )}
                        </strong>

                        <span>
                          Total quoted price
                        </span>
                      </div>

                      <BookingOptions
                        options={offer.booking_options}
                      />
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flight-no-matches">
                <h3>No matching flights</h3>

                <p>
                  No returned flights match your selected
                  airline and price limit. Try adjusting
                  the filters.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>
            )}

            <p className="flight-results-message">
              Prices and availability may change at
              the booking provider. Confirm the
              final fare and fees before purchase.
            </p>
          </>
        )}

        {!loading &&
          !error &&
          offers.length === 0 && (
            <p className="flight-results-message">
              {lastSearch
                ? "No flights were returned. Try another route or date."
                : "Enter your trip details above to find available flights."}
            </p>
          )}
      </div>

      <div className="search-flights-note">
        <span aria-hidden="true">✈</span>

        <p>
          Choose your destinations and dates
          to get started.
        </p>
      </div>
    </section>
  );
}
