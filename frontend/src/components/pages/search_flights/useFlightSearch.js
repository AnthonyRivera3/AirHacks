import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

function getFirstValue(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
}

function normalizeOffer(offer, index) {
  const pricingOption =
    offer.pricing_options?.[0] ||
    offer.pricingOptions?.[0] ||
    offer.price_option ||
    {};

  const item = pricingOption.items?.[0] || {};

  const priceValue = getFirstValue(
    pricingOption.price?.amount,
    item.price?.amount,
    offer.price?.amount,
    offer.price,
    offer.total_price,
    offer.amount
  );

  const currency = getFirstValue(
    pricingOption.price?.currency,
    item.price?.currency,
    offer.price?.currency,
    offer.currency,
    "USD"
  );

  const bookingUrl = getFirstValue(
    item.url,
    item.deepLink,
    item.deeplink,
    item.booking_url,
    pricingOption.url,
    pricingOption.deepLink,
    pricingOption.deeplink,
    offer.deepLink,
    offer.deeplink,
    offer.booking_url,
    offer.url
  );

  return {
    id: String(
      getFirstValue(offer.id, offer.itinerary_id, offer.offer_id, index)
    ),
    price:
      priceValue !== undefined && Number.isFinite(Number(priceValue))
        ? Number(priceValue)
        : null,
    currency,
    bookingUrl:
      typeof bookingUrl === "string" && bookingUrl.trim()
        ? bookingUrl
        : null,
    raw: offer,
  };
}

function extractOffers(responseData) {
  const candidates = [
    responseData?.itineraries,
    responseData?.data?.itineraries,
    responseData?.results?.itineraries,
    responseData?.data?.results?.itineraries,
    responseData?.offers,
    responseData?.data?.offers,
    responseData?.results?.offers,
    responseData?.data?.results?.offers,
  ];

  return candidates.find(Array.isArray) || [];
}

export function useFlightSearch() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchFlights(search) {
    setLoading(true);
    setError("");
    setOffers([]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/flights/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            origin: search.origin.trim().toUpperCase(),
            destination: search.destination.trim().toUpperCase(),
            departureDate: search.departureDate,
            adults: Number(search.adults ?? 1),
            children: Number(search.children ?? 0),
            infants: Number(search.infants ?? 0),
            cabinClass: search.cabinClass || "Economy",
            currency: search.currency || "USD",
          }),
        }
      );

      const responseText = await response.text();
      let result;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `The server returned an invalid response (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            `Flight search failed (HTTP ${response.status}).`
        );
      }

      const responseData = result.data ?? result;
      const rawOffers = extractOffers(responseData);
      const normalizedOffers = rawOffers.map(normalizeOffer);

      setOffers(normalizedOffers);

      if (normalizedOffers.length === 0) {
        console.log("FlightAPI response for mapping:", result);
        setError(
          "The request succeeded, but no flight offers were found in the response. Check the backend response structure."
        );
      }

      return normalizedOffers;
    } catch (err) {
      console.error("Flight search error:", err);

      const message =
        err instanceof TypeError
          ? "Could not connect to the flight-search server. Make sure the backend is running on port 5001."
          : err.message || "Unable to search flights. Please try again.";

      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    offers,
    loading,
    error,
    searchFlights,
  };
}