
import { useState } from "react";
import { useFlightSearch } from "./useFlightSearch";

import "./Search_flights.css";
import "./Search_flights-mobile.css";

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

  return `${Math.floor(total / 60)}h ${total % 60}m`;
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
          <small>{displayDate(slice.departure?.date)}</small>
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
          <small>{displayDate(slice.arrival?.date)}</small>
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

function BookingOptions({ options }) {
  if (!options?.length) {
    return (
      <p>
        Booking links were not provided for this itinerary.
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
            {option.provider} · {displayPrice(option.price)}
            {option.isSplit ? " · Separate tickets" : ""}
          </p>

          {option.isSplit ? (
            <div>
              <small>
                Outbound and return tickets must be booked
                separately. Check both fares before purchasing.
              </small>

              <div>
                {option.departure?.bookingUrl ? (
                  <a
                    href={option.departure.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Book outbound with{" "}
                    {option.departure.provider} (
                    {displayPrice(option.departure.price)})
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
                    {option.arrival.provider} (
                    {displayPrice(option.arrival.price)})
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
            <span>Direct booking link unavailable.</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SearchFlights() {
  const [tripType, setTripType] = useState("round-trip");

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [adults, setAdults] = useState("1");
  const [cabinClass, setCabinClass] = useState("economy");
  const [lastSearch, setLastSearch] = useState(null);

  const {
    offers,
    loading,
    error,
    searchFlights,
  } = useFlightSearch();

  async function handleSearch(event) {
    event.preventDefault();

    const from = origin.trim().toUpperCase();
    const to = destination.trim().toUpperCase();

    if (
      !/^[A-Z]{3}$/.test(from) ||
      !/^[A-Z]{3}$/.test(to)
    ) {
      alert(
        "Enter a three-letter airport or city code such as JFK, LAX, or NYC."
      );
      return;
    }

    if (from === to) {
      alert("Origin and destination must be different.");
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

    setLastSearch(search);
    await searchFlights(search);
  }

  return (
    <section className="search-flights-page">
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
              placeholder="Airport or city code (e.g. JFK)"
              maxLength={3}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              autoComplete="off"
              required
            />
          </label>

          <label className="flight-field">
            <span>To</span>
            <input
              type="text"
              placeholder="Airport or city code (e.g. LAX)"
              maxLength={3}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
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
              onChange={(e) =>
                setDepartureDate(e.target.value)
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
                onChange={(e) =>
                  setReturnDate(e.target.value)
                }
                required
              />
            </label>
          )}

          <label className="flight-field passenger-field">
            <span>Adults</span>
            <select
              value={adults}
              onChange={(e) => setAdults(e.target.value)}
            >
              {Array.from(
                { length: 8 },
                (_, i) => i + 1
              ).map((count) => (
                <option key={count} value={count}>
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
              onChange={(e) =>
                setCabinClass(e.target.value)
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
                onClick={() =>
                  searchFlights(lastSearch)
                }
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {!loading && !error && offers.length > 0 && (
          <>
            <h2>
              Available Flights ({offers.length})
            </h2>

            <p className="flight-results-message">
              USD totals for all selected adults.
              Departure and arrival times are local
              to each airport.
            </p>

            <div className="flight-results-list">
              {offers.map((offer, index) => {
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
                            key={slice.id}
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
                        {displayPrice(offer.total_amount)}
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

            <p className="flight-results-message">
              Prices and availability can change at
              the booking provider. Confirm the final
              fare and fees before purchase.
            </p>
          </>
        )}

        {!loading &&
          !error &&
          offers.length === 0 && (
            <p className="flight-results-message">
              {lastSearch
                ? "No flight offers were returned for this search. Try another route or date."
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
