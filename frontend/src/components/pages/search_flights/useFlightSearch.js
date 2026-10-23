
import { useState } from "react";

const API_URL = "http://localhost:5001/api/flights/search";

export function useFlightSearch() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchFlights(search) {
    setLoading(true);
    setError("");
    setOffers([]);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(search),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Flight search failed.");
      }

      setOffers(result.offers || []);
    } catch (err) {
      setError(
        err.message || "Could not connect. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return { offers, loading, error, searchFlights };
}
