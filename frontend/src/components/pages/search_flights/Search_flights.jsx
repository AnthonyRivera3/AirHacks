
import { useState } from "react";
import { useFlightSearch } from "./useFlightSearch";
import "./Search_flights.css";
import "./Search_flights-mobile.css";

function SearchFlights() {
  const [tripType, setTripType] = useState("round-trip");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const { offers, loading, error, searchFlights } = useFlightSearch();
  const [lastSearch, setLastSearch] = useState(null);

  async function handleSearch(event) {
    event.preventDefault();

    if (!origin.trim() || !destination.trim() || !departureDate) {
      alert("Please enter your origin, destination, and departure date.");
      return;
    }

    const originCode = origin.trim().toUpperCase();
    const destinationCode = destination.trim().toUpperCase();

    if (originCode === destinationCode) {
      alert("Origin and destination must be different.");
      return;
    }

    if (tripType === "round-trip" && !returnDate) {
      alert("Please select a return date.");
      return;
    }

    if (tripType === "round-trip" && returnDate < departureDate) {
      alert("Your return date must be on or after your departure date.");
      return;
    }

    const search = {
      origin: originCode,
      destination: destinationCode,
      departureDate,
      passengers: Number(passengers),
      cabinClass: "economy",
      ...(tripType === "round-trip" ? { returnDate } : {}),
    };

    setLastSearch(search);
    await searchFlights(search);
  }

  function getTravelportOffer(offer) {
    // If the backend already normalizes an offer to the Duffel-like shape,
    // use it directly.
    if (offer.slices?.[0]?.segments?.length) {
      return offer;
    }

    const offering =
      offer?.Product?.[0] ??
      offer?.product?.[0] ??
      offer;

    const products = offering?.FlightSegment ??
      offering?.flightSegment ??
      offering?.segments ??
      [];

    const segments = Array.isArray(products) ? products : [];

    if (!segments.length) {
      return null;
    }

    const mappedSegments = segments.map((segment) => ({
      departing_at:
        segment?.Departure?.date +
        (segment?.Departure?.time ? `T${segment.Departure.time}` : "") ||
        segment?.departureDateTime ||
        segment?.departing_at,
      arriving_at:
        segment?.Arrival?.date +
        (segment?.Arrival?.time ? `T${segment.Arrival.time}` : "") ||
        segment?.arrivalDateTime ||
        segment?.arriving_at,
      origin: {
        iata_code:
          segment?.Departure?.location ??
          segment?.origin ??
          segment?.originCode ??
          "",
      },
      destination: {
        iata_code:
          segment?.Arrival?.location ??
          segment?.destination ??
          segment?.destinationCode ??
          "",
      },
      operating_carrier: {
        name:
          segment?.Flight?.operatingCarrier ??
          segment?.operatingCarrierName ??
          segment?.carrierName ??
          "",
        logo_symbol_url: null,
      },
      marketing_carrier: {
        name:
          segment?.Flight?.carrier ??
          segment?.marketingCarrierName ??
          "",
        logo_symbol_url: null,
      },
    }));

    return {
      id:
        offer?.id ??
        offer?.Identifier?.value ??
        offer?.id ??
        `${mappedSegments[0]?.origin?.iata_code}-${mappedSegments[0]?.destination?.iata_code}-${mappedSegments[0]?.departing_at}`,
      owner: {
        name:
          offer?.owner?.name ??
          mappedSegments[0]?.operating_carrier?.name ??
          mappedSegments[0]?.marketing_carrier?.name ??
          "Airline",
      },
      slices: [
        {
          segments: mappedSegments,
          duration: offer?.duration ?? "",
        },
      ],
      total_currency:
        offer?.Price?.CurrencyCode?.value ??
        offer?.price?.currencyCode ??
        offer?.total_currency ??
        "",
      total_amount:
        offer?.Price?.TotalPrice ??
        offer?.price?.total ??
        offer?.total_amount ??
        "",
    };
  }

  function formatTime(dateTime) {
    if (!dateTime) return "—";

    const parsedDate = new Date(dateTime);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(dateTime);
    }

    return parsedDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const displayOffers = offers
    .map(getTravelportOffer)
    .filter(Boolean);

  return (
    <section className="search-flights-page">
      <div className="search-flights-hero">
        <p className="search-flights-eyebrow">
          YOUR NEXT ADVENTURE STARTS HERE
        </p>
        <h1>Where will you go next?</h1>
        <p className="search-flights-intro">
          Find flights, compare options, and plan your next journey.
        </p>
      </div>

      <div className="search-flights-card">
        <div className="trip-type-options" aria-label="Trip type">
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

        <form className="flight-search-form" onSubmit={handleSearch}>
          <label className="flight-field">
            <span>From</span>
            <input
              type="text"
              placeholder="Airport code (e.g. JFK)"
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              autoComplete="off"
              maxLength={3}
              required
            />
          </label>

          <label className="flight-field">
            <span>To</span>
            <input
              type="text"
              placeholder="Airport code (e.g. LAX)"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              autoComplete="off"
              maxLength={3}
              required
            />
          </label>

          <label className="flight-field">
            <span>Departure</span>
            <input
              type="date"
              value={departureDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(event) => setDepartureDate(event.target.value)}
              required
            />
          </label>

          {tripType === "round-trip" && (
            <label className="flight-field">
              <span>Return</span>
              <input
                type="date"
                value={returnDate}
                min={departureDate || new Date().toISOString().split("T")[0]}
                onChange={(event) => setReturnDate(event.target.value)}
                required
              />
            </label>
          )}

          <label className="flight-field passenger-field">
            <span>Passengers</span>
            <select
              value={passengers}
              onChange={(event) => setPassengers(event.target.value)}
            >
              <option value="1">1 passenger</option>
              <option value="2">2 passengers</option>
              <option value="3">3 passengers</option>
              <option value="4">4 passengers</option>
              <option value="5">5 passengers</option>
              <option value="6">6 passengers</option>
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

      <div className="flight-results" aria-live="polite">
        {loading && (
          <p className="flight-results-message">
            Searching Travelport for available flights...
          </p>
        )}

        {error && (
          <div className="flight-results-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              disabled={loading || !lastSearch}
              onClick={() => lastSearch && searchFlights(lastSearch)}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && displayOffers.length > 0 && (
          <>
            <h2>Available Flights</h2>

            <div className="flight-results-list">
              {displayOffers.map((offer, index) => {
                const slice = offer.slices?.[0];
                const segments = slice?.segments || [];
                const firstSegment = segments[0];
                const lastSegment = segments[segments.length - 1];

                if (!firstSegment || !lastSegment) return null;

                const airlineLogo =
                  firstSegment.operating_carrier?.logo_symbol_url ||
                  firstSegment.marketing_carrier?.logo_symbol_url ||
                  offer.owner?.logo_symbol_url;

                return (
                  <article
                    className="flight-result-card"
                    key={offer.id || `flight-${index}`}
                  >
                    <div className="flight-result-airline">
                      {airlineLogo && (
                        <img
                          src={airlineLogo}
                          alt=""
                          width="40"
                          height="40"
                        />
                      )}

                      <strong>
                        {firstSegment.operating_carrier?.name ||
                          firstSegment.marketing_carrier?.name ||
                          offer.owner?.name ||
                          "Airline"}
                      </strong>
                    </div>

                    <div className="flight-result-route">
                      <div>
                        <strong>
                          {formatTime(firstSegment.departing_at)}
                        </strong>
                        <span>
                          {firstSegment.origin?.iata_code || "—"}
                        </span>
                      </div>

                      <div className="flight-result-duration">
                        <span>
                          {segments.length === 1
                            ? "Nonstop"
                            : `${segments.length - 1} stop(s)`}
                        </span>
                        <span>{slice.duration || ""}</span>
                      </div>

                      <div>
                        <strong>
                          {formatTime(lastSegment.arriving_at)}
                        </strong>
                        <span>
                          {lastSegment.destination?.iata_code || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flight-result-price">
                      <strong>
                        {offer.total_currency} {offer.total_amount}
                      </strong>
                      <span>Total price</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {!loading && !error && offers.length === 0 && (
          <p className="flight-results-message">
            Enter your trip details above to find available flights.
          </p>
        )}

        {!loading &&
          !error &&
          offers.length > 0 &&
          displayOffers.length === 0 && (
            <p className="flight-results-message">
              Travelport returned a response, but its flight-offer format
              needs to be mapped before the results can be displayed.
              Check the browser console and backend response.
            </p>
          )}
      </div>

      <div className="search-flights-note">
        <span aria-hidden="true">✈</span>
        <p>Choose your destinations and dates to get started.</p>
      </div>
    </section>
  );
}

export default SearchFlights;
