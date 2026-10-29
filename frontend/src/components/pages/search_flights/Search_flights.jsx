import { useState } from "react";
import { useFlightSearch } from "./useFlightSearch";
import "./Search_flights.css";
import "./Search_flights-mobile.css";

export default function Search_flights() {
  const {
    offers,
    loading,
    error,
    searchFlights,
  } = useFlightSearch();

  const [form, setForm] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: "Economy",
    currency: "USD",
  });

  const [searched, setSearched] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: ["adults", "children", "infants"].includes(name)
        ? Number(value)
        : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSearched(true);

    await searchFlights({
      ...form,
      origin: form.origin.trim().toUpperCase(),
      destination: form.destination.trim().toUpperCase(),
    });
  }

  function getOfferPrice(offer) {
    if (typeof offer.price === "number") {
      return offer.price.toLocaleString(undefined, {
        style: "currency",
        currency: offer.currency || form.currency,
      });
    }

    if (offer.price) {
      return `${offer.currency || form.currency} ${offer.price}`;
    }

    return "Price unavailable";
  }

  function getOfferSummary(offer) {
    const itinerary = offer.raw || offer;
    const segments =
      itinerary.segments ||
      itinerary.legs?.[0]?.segments ||
      itinerary.itineraries?.[0]?.segments ||
      [];

    if (segments.length > 0) {
      return segments
        .map((segment) => {
          const from =
            segment.origin?.display_code ||
            segment.origin?.code ||
            segment.departure_airport?.id ||
            segment.departure_airport ||
            "";
          const to =
            segment.destination?.display_code ||
            segment.destination?.code ||
            segment.arrival_airport?.id ||
            segment.arrival_airport ||
            "";
          const carrier =
            segment.marketing_carrier?.name ||
            segment.airline?.name ||
            segment.carrier_name ||
            "";

          return [from && to ? `${from} → ${to}` : "", carrier]
            .filter(Boolean)
            .join(" · ");
        })
        .filter(Boolean)
        .join(" | ");
    }

    return (
      itinerary.carrier_name ||
      itinerary.airline_name ||
      itinerary.airline ||
      "Flight details provided by the flight API"
    );
  }

  return (
    <main className="flight-search">
      <h1>Search Flights</h1>
      <p>Find flight options for your next trip.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="origin">
          From (airport code)
          <input
            id="origin"
            name="origin"
            type="text"
            placeholder="JFK"
            value={form.origin}
            onChange={handleChange}
            maxLength={3}
            required
          />
        </label>

        <label htmlFor="destination">
          To (airport code)
          <input
            id="destination"
            name="destination"
            type="text"
            placeholder="LAX"
            value={form.destination}
            onChange={handleChange}
            maxLength={3}
            required
          />
        </label>

        <label htmlFor="departureDate">
          Departure date
          <input
            id="departureDate"
            name="departureDate"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={form.departureDate}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="adults">
          Adults
          <select
            id="adults"
            name="adults"
            value={form.adults}
            onChange={handleChange}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="children">
          Children
          <select
            id="children"
            name="children"
            value={form.children}
            onChange={handleChange}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="infants">
          Infants
          <select
            id="infants"
            name="infants"
            value={form.infants}
            onChange={handleChange}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="cabinClass">
          Cabin class
          <select
            id="cabinClass"
            name="cabinClass"
            value={form.cabinClass}
            onChange={handleChange}
          >
            <option value="Economy">Economy</option>
            <option value="PremiumEconomy">Premium Economy</option>
            <option value="Business">Business</option>
            <option value="First">First Class</option>
          </select>
        </label>

        <label htmlFor="currency">
          Currency
          <select
            id="currency"
            name="currency"
            value={form.currency}
            onChange={handleChange}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
          </select>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search Flights"}
        </button>
      </form>

      {error && (
        <p className="flight-error" role="alert">
          {error}
        </p>
      )}

      {loading && <p>Searching for available flights...</p>}

      {!loading && searched && !error && offers.length === 0 && (
        <p>No flights were returned for this search. Try another date or route.</p>
      )}

      {!loading && offers.length > 0 && (
        <section className="flight-results">
          <h2>Flight Results ({offers.length})</h2>

          {offers.map((offer, index) => (
            <article
              className="flight-offer"
              key={offer.id || `${form.origin}-${form.destination}-${index}`}
            >
              <div>
                <h3>Flight option {index + 1}</h3>
                <p>{getOfferSummary(offer)}</p>
                <p>
                  {form.origin} → {form.destination}
                </p>
                <p>Departure: {form.departureDate}</p>
              </div>

              <div>
                <strong>{getOfferPrice(offer)}</strong>

                {offer.bookingUrl ? (
                  <p>
                    <a
                      href={offer.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View booking options
                    </a>
                  </p>
                ) : (
                  <p>Booking link not provided by the API.</p>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}