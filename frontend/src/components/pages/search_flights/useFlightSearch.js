
import { useState } from "react";

const API_BASE_URL = "http://localhost:5001";

export function useFlightSearch() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchFlights(search) {
    setLoading(true);
    setError("");
    setOffers([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/flights/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(search),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Flight search failed (${response.status}).`
        );
      }

      // The backend currently returns the raw Travelport response in `data`.
      const travelport = result.data ?? result;

      // Travelport's response schema differs from Duffel's. Check common
      // locations without assuming that every response uses the same shape.
      const candidates = [
        travelport?.CatalogProductOfferings?.CatalogProductOffering,
        travelport?.CatalogProductOffering,
        travelport?.data?.CatalogProductOfferings?.CatalogProductOffering,
        travelport?.offers,
      ];

      const rawOffers = candidates.find(Array.isArray) ?? [];

      // Keep the response intact for now. A provider-specific adapter will
      // be needed to render Travelport offers as the current flight cards.
      setOffers(rawOffers);

      if (rawOffers.length === 0) {
        console.log("Travelport response for schema mapping:", travelport);
        setError(
          "The search completed, but no recognizable flight offers were found. Check the backend response to map Travelport's offer format."
        );
      }

      return rawOffers;
    } catch (err) {
      setError(err.message || "Unable to search flights. Please try again.");
      return [];
    } finally {
      setLoading(false);
    }
  }

  return { offers, loading, error, searchFlights };
}
