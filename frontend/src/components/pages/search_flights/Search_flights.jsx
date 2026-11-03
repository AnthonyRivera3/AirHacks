
import { useMemo, useState } from "react";
import FlightAirportPicker from "./FlightAirportPicker";
import { useFlightSearch } from "./useFlightSearch";
import "./Search_flights.css";
import "./Search_flights-mobile.css";

// ========================================
// FORMATTING HELPERS
// ========================================

function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function priceNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : null;
}

function formatPrice(value) {
  const amount = priceNumber(value);

  if (amount === null) return "Price unavailable";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatTime(value) {
  const match =
    typeof value === "string"
      ? value.match(/^(\d{2}):(\d{2})/)
      : null;

  if (!match) return "--:--";

  const hour = Number(match[1]);

  return `${hour % 12 || 12}:${match[2]} ${
    hour >= 12 ? "PM" : "AM"
  }`;
}

function formatDate(value) {
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

function formatDuration(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "Duration unavailable";
  }

  const minutes = Math.round(Number(value));

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

// ========================================
// FLIGHT DATA HELPERS
// ========================================

function isBookable(option) {
  if (!option || priceNumber(option.price) === null) {
    return false;
  }

  if (option.isSplit) {
    return Boolean(
      option.departure?.bookingUrl &&
      option.arrival?.bookingUrl
    );
  }

  return Boolean(option.bookingUrl);
}

function cheapestLinkedFare(offer) {
  const prices = (offer.booking_options || [])
    .filter(isBookable)
    .map((option) => priceNumber(option.price))
    .filter((price) => price !== null);

  return prices.length ? Math.min(...prices) : null;
}

function offerAirlines(offer) {
  return [
    ...new Set(
      (offer.slices || []).flatMap((slice) =>
        (slice.segments || [])
          .map((segment) => segment.airline_name)
          .filter(
            (name) =>
              typeof name === "string" && name.trim()
          )
          .map((name) => name.trim())
      )
    ),
  ];
}

function legStops(slice) {
  if (Number.isInteger(slice.stop_count)) {
    return slice.stop_count;
  }

  const segments = slice.segments || [];

  return segments.length ? segments.length - 1 : null;
}

function median(values) {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

// ========================================
// FLIGHT LEG COMPONENT
// ========================================

function FlightLeg({ slice, label }) {
  const segments = slice.segments || [];

  const airlines = [
    ...new Set(
      segments
        .map((segment) => segment.airline_name)
        .filter(Boolean)
    ),
  ];

  const flightNumbers = segments
    .map((segment) => segment.flight_number)
    .filter(Boolean);

  const stops = legStops(slice);

  return (
    <div className="flight-leg">
      <p className="flight-leg-label">
        <strong>{label}</strong>
      </p>

      <div className="flight-result-route">
        <div>
          <strong>{formatTime(slice.departure?.time)}</strong>
          <span>{slice.departure?.code || "—"}</span>
          <small>{formatDate(slice.departure?.date)}</small>
        </div>

        <div className="flight-result-duration">
          <span>
            {stops === null
              ? "Stops unavailable"
              : stops === 0
                ? "Nonstop"
                : `${stops} ${stops === 1 ? "stop" : "stops"}`}
          </span>

          <span>{formatDuration(slice.duration_minutes)}</span>
        </div>

        <div>
          <strong>{formatTime(slice.arrival?.time)}</strong>
          <span>{slice.arrival?.code || "—"}</span>
          <small>{formatDate(slice.arrival?.date)}</small>
        </div>
      </div>

      {(airlines.length > 0 || flightNumbers.length > 0) && (
        <p className="flight-results-message">
          {airlines.join(", ")}
          {flightNumbers.length > 0
            ? ` · ${flightNumbers.join(" / ")}`
            : ""}
        </p>
      )}
    </div>
  );
}

// ========================================
// BOOKING OPTIONS COMPONENT
// ========================================

function BookingOptions({ options = [] }) {
  if (!options.length) {
    return (
      <p>
        Booking links were not provided for this itinerary.
      </p>
    );
  }

  const sortedOptions = [...options].sort(
    (a, b) =>
      Number(isBookable(b)) - Number(isBookable(a)) ||
      (priceNumber(a.price) ?? Infinity) -
        (priceNumber(b.price) ?? Infinity)
  );

  return (
    <div className="flight-booking-options">
      <strong>Compare booking providers</strong>

      {sortedOptions.map((option, index) => (
        <div
          className="flight-booking-option"
          key={`${option.provider}-${index}`}
        >
          <p>
            {option.provider} · {formatPrice(option.price)}
            {option.isSplit ? " · Separate tickets" : ""}
          </p>

          {option.isSplit ? (
            <div>
              <small>
                Outbound and return tickets must be booked
                separately. Confirm both final fares.
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
                  <span>Outbound booking link unavailable.</span>
                )}
              </div>

              <div>
                {option.arrival?.bookingUrl ? (
                  <a
                    href={option.arrival.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Book return with {option.arrival.provider}
                  </a>
                ) : (
                  <span>Return booking link unavailable.</span>
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
            <span>Direct booking link unavailable.</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ========================================
// MAIN SEARCH FLIGHTS PAGE
// ========================================

export default function SearchFlights() {
  // Search form
  const [tripType, setTripType] = useState("round-trip");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState("1");
  const [cabinClass, setCabinClass] = useState("economy");
  const [lastSearch, setLastSearch] = useState(null);

  // Filters
  const [selectedAirline, setSelectedAirline] = useState("all");
  const [stopsFilter, setStopsFilter] = useState("all");
  const [minLimit, setMinLimit] = useState(null);
  const [maxLimit, setMaxLimit] = useState(null);

  const {
    offers,
    loading,
    error,
    searchFlights,
  } = useFlightSearch();

  // ========================================
  // NORMALIZE PRICES FOR COMPARISON
  // ========================================

  const pricedOffers = useMemo(
    () =>
      offers.map((offer) => {
        const linkedPrice = cheapestLinkedFare(offer);

        return {
          ...offer,
          comparisonPrice:
            linkedPrice ?? priceNumber(offer.total_amount),
          hasLinkedFare: linkedPrice !== null,
        };
      }),
    [offers]
  );

  // ========================================
  // AVAILABLE AIRLINES
  // ========================================

  const airlines = useMemo(() => {
    const names = pricedOffers.flatMap(offerAirlines);

    return [...new Set(names)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [pricedOffers]);

  // ========================================
  // PRICE RANGE
  // ========================================

  const prices = useMemo(
    () =>
      pricedOffers
        .map((offer) => offer.comparisonPrice)
        .filter((price) => price !== null),
    [pricedOffers]
  );

  const priceBounds = useMemo(
    () =>
      prices.length
        ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
          }
        : null,
    [prices]
  );

  const typicalPrice = useMemo(
    () => median(prices),
    [prices]
  );

  const selectedMin = priceBounds
    ? Math.max(
        priceBounds.min,
        Math.min(
          minLimit ?? priceBounds.min,
          priceBounds.max
        )
      )
    : 0;

  const selectedMax = priceBounds
    ? Math.min(
        priceBounds.max,
        Math.max(
          maxLimit ?? priceBounds.max,
          selectedMin
        )
      )
    : 0;

  const spread = priceBounds
    ? priceBounds.max - priceBounds.min
    : 0;

  const minPct = spread
    ? ((selectedMin - priceBounds.min) / spread) * 100
    : 0;

  const maxPct = spread
    ? ((selectedMax - priceBounds.min) / spread) * 100
    : 100;

  // ========================================
  // FILTER AND SORT FLIGHTS
  // ========================================

  const filteredOffers = useMemo(() => {
    return pricedOffers
      .filter((offer) => {
        const airlineMatch =
          selectedAirline === "all" ||
          offerAirlines(offer).includes(selectedAirline);

        const legs = offer.slices || [];

        const stopsMatch =
          stopsFilter === "all" ||
          (legs.length > 0 &&
            legs.every((slice) => {
              const stops = legStops(slice);

              if (stops === null) return false;
              if (stopsFilter === "nonstop") return stops === 0;
              if (stopsFilter === "one") return stops === 1;
              if (stopsFilter === "two-plus") return stops >= 2;

              return true;
            }));

        const priceMatch =
          offer.comparisonPrice === null
            ? minLimit === null && maxLimit === null
            : offer.comparisonPrice >= selectedMin - 0.005 &&
              offer.comparisonPrice <= selectedMax + 0.005;

        return airlineMatch && stopsMatch && priceMatch;
      })
      .sort(
        (a, b) =>
          (a.comparisonPrice ?? Infinity) -
          (b.comparisonPrice ?? Infinity)
      );
  }, [
    pricedOffers,
    selectedAirline,
    stopsFilter,
    selectedMin,
    selectedMax,
    minLimit,
    maxLimit,
  ]);

  function resetFilters() {
    setSelectedAirline("all");
    setStopsFilter("all");
    setMinLimit(null);
    setMaxLimit(null);
  }

  // ========================================
  // SEARCH SUBMISSION
  // ========================================

  async function handleSearch(event) {
    event.preventDefault();

    const from = origin.trim().toUpperCase();
    const to = destination.trim().toUpperCase();

    // Both values come from FlightAirportPicker.
    if (
      !/^[A-Z]{3}$/.test(from) ||
      !/^[A-Z]{3}$/.test(to)
    ) {
      alert(
        "Please select a departure state and airport and a destination state and airport."
      );
      return;
    }

    if (from === to) {
      alert(
        "Departure and destination airports must be different."
      );
      return;
    }

    if (!departureDate || departureDate < todayLocal()) {
      alert("Please choose a valid future departure date.");
      return;
    }

    if (
      tripType === "round-trip" &&
      (!returnDate || returnDate < departureDate)
    ) {
      alert(
        "Please select a return date on or after your departure date."
      );
      return;
    }

    const search = {
      origin: from,
      destination: to,
      departureDate,
      ...(tripType === "round-trip" ? { returnDate } : {}),
      tripType,
      adults: Number(adults),
      cabinClass,
    };

    resetFilters();
    setLastSearch(search);
    await searchFlights(search);
  }

  function retrySearch() {
    if (!lastSearch) return;

    resetFilters();
    searchFlights(lastSearch);
  }

  // ========================================
  // JSX PAGE LAYOUT
  // ========================================

  return (
    <section className="search-flights-page">

      {/* Hero */}

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

      {/* Search Card */}

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

          {/* NEW: Departure state and airport */}

          <FlightAirportPicker
            label="From"
            value={origin}
            onChange={setOrigin}
          />

          {/* NEW: Destination state and airport */}

          <FlightAirportPicker
            label="To"
            value={destination}
            onChange={setDestination}
          />

          {/* Departure Date */}

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

          {/* Return Date */}

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

          {/* Adults */}

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
                <option key={count} value={count}>
                  {count} {count === 1 ? "adult" : "adults"}
                </option>
              ))}
            </select>
          </label>

          {/* Cabin Class */}

          <label className="flight-field">
            <span>Cabin class</span>

            <select
              value={cabinClass}
              onChange={(event) =>
                setCabinClass(event.target.value)
              }
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">
                Premium Economy
              </option>
              <option value="business">Business</option>
              <option value="first_class">First</option>
            </select>
          </label>

          {/* Search Button */}

          <button
            className="flight-search-button"
            type="submit"
            disabled={loading}
          >
            <span aria-hidden="true">⌕</span>{" "}
            {loading ? "Searching..." : "Search Flights"}
          </button>
        </form>
      </div>

      {/* =====================================
          FLIGHT RESULTS
      ===================================== */}

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

        {!loading && !error && offers.length > 0 && (
          <>
            <div className="flight-results-heading">
              <div>
                <h2>Available Flights</h2>

                <p>
                  Showing {filteredOffers.length} of{" "}
                  {offers.length} options · Lowest price first
                </p>
              </div>
            </div>

            {/* =====================================
                FILTER PANEL
            ===================================== */}

            <div className="flight-filters">

              <div className="flight-filters-heading">
                <div>
                  <h3>Filter flights</h3>

                  <p>
                    Change filters without making
                    another API request.
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

                {/* Airline filter */}

                <label className="flight-filter-field">
                  <span>Airline</span>

                  <select
                    value={selectedAirline}
                    onChange={(event) =>
                      setSelectedAirline(event.target.value)
                    }
                  >
                    <option value="all">
                      All airlines
                    </option>

                    {airlines.map((airline) => (
                      <option
                        key={airline}
                        value={airline}
                      >
                        {airline}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Stops filter */}

                <label className="flight-filter-field">
                  <span>Stops (each direction)</span>

                  <select
                    value={stopsFilter}
                    onChange={(event) =>
                      setStopsFilter(event.target.value)
                    }
                  >
                    <option value="all">Any stops</option>
                    <option value="nonstop">Nonstop</option>
                    <option value="one">1 stop</option>
                    <option value="two-plus">2+ stops</option>
                  </select>
                </label>

                {/* Two-thumb price filter */}

                {priceBounds && (
                  <div className="flight-price-filter">
                    <div className="flight-price-filter-heading">
                      <strong>Price range (total, USD)</strong>

                      <span>
                        {formatPrice(selectedMin)} –{" "}
                        {formatPrice(selectedMax)}
                      </span>
                    </div>

                    <div
                      className="flight-dual-range"
                      style={{
                        "--low-pct": `${minPct}%`,
                        "--high-pct": `${maxPct}%`,
                      }}
                    >
                      <div className="flight-dual-range-track" />
                      <div className="flight-dual-range-active" />

                      <input
                        className="flight-range-min"
                        type="range"
                        aria-label="Minimum flight price"
                        min={priceBounds.min}
                        max={priceBounds.max}
                        step="0.01"
                        value={selectedMin}
                        disabled={spread === 0}
                        onChange={(event) =>
                          setMinLimit(
                            Math.min(
                              Number(event.target.value),
                              selectedMax
                            )
                          )
                        }
                      />

                      <input
                        className="flight-range-max"
                        type="range"
                        aria-label="Maximum flight price"
                        min={priceBounds.min}
                        max={priceBounds.max}
                        step="0.01"
                        value={selectedMax}
                        disabled={spread === 0}
                        onChange={(event) =>
                          setMaxLimit(
                            Math.max(
                              Number(event.target.value),
                              selectedMin
                            )
                          )
                        }
                      />
                    </div>

                    <div className="flight-price-range">
                      <span>
                        {formatPrice(priceBounds.min)}
                      </span>

                      <span>
                        {formatPrice(priceBounds.max)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="flight-results-message">
              USD totals for all selected adults.
              Times are local to each airport.
              Airline filters may match one segment
              of a multi-airline itinerary.
            </p>

            {/* =====================================
                FILTERED FLIGHT CARDS
            ===================================== */}

            {filteredOffers.length > 0 ? (
              <div className="flight-results-list">
                {filteredOffers.map((offer, index) => {
                  const firstFlight =
                    offer.slices?.[0]?.segments?.[0];

                  const adultCount = Math.max(
                    1,
                    Number(lastSearch?.adults) || 1
                  );

                  // Flag unusually high fares.
                  // Do not remove them automatically.

                  const unusuallyHigh =
                    offer.comparisonPrice !== null &&
                    (
                      offer.comparisonPrice / adultCount >= 10000 ||
                      (
                        typicalPrice !== null &&
                        offer.comparisonPrice > typicalPrice * 3 &&
                        offer.comparisonPrice / adultCount > 1500
                      )
                    );

                  return (
                    <article
                      className="flight-result-card"
                      key={`${offer.id}-${index}`}
                    >

                      {/* Airline Header */}

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

                      {/* Outbound and Return */}

                      {(offer.slices || []).map(
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
                      )}

                      {!offer.slices?.length && (
                        <p>
                          Detailed itinerary unavailable.
                        </p>
                      )}

                      {/* Price */}

                      <div className="flight-result-price">
                        <strong>
                          {offer.hasLinkedFare
                            ? "From "
                            : "Quoted "}
                          {formatPrice(
                            offer.comparisonPrice
                          )}
                        </strong>

                        <span>
                          {offer.hasLinkedFare
                            ? "Lowest linked booking-provider quote"
                            : "API quote · booking price not confirmed"}
                        </span>
                      </div>

                      {/* Fare Warning */}

                      {unusuallyHigh && (
                        <p
                          className="flight-fare-warning"
                          role="note"
                        >
                          ⚠ This fare is unusually high
                          compared with other results
                          or per traveler. Review the
                          price and full itinerary on
                          the booking site before paying.
                        </p>
                      )}

                      {/* Booking Providers */}

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
                  Adjust the airline, stops, or
                  price range to see more results.
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
              Prices and availability may change.
              Confirm final fares, baggage, taxes,
              and fees with the booking provider.
            </p>
          </>
        )}

        {!loading && !error && offers.length === 0 && (
          <p className="flight-results-message">
            {lastSearch
              ? "No flights were returned. Try another route or date."
              : "Select your departure and destination airports and travel dates to find flights."}
          </p>
        )}
      </div>

      {/* Bottom Note */}

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
