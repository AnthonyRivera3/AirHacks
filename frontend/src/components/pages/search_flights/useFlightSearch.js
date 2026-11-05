
import { useEffect, useRef, useState } from "react";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

export function useFlightSearch() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeRequest = useRef(null);

  useEffect(
    () => () => activeRequest.current?.abort(),
    []
  );

  async function searchFlights(search) {
    activeRequest.current?.abort();

    const controller = new AbortController();
    activeRequest.current = controller;

    setLoading(true);
    setError("");
    setOffers([]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/flights/search`,
        {
          method: "POST",

          // Send the AirHacks login session cookie.
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify(search),
          signal: controller.signal,
        }
      );

      const raw = await response.text();
      let data;

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          `The backend returned invalid JSON (HTTP ${response.status}).`
        );
      }

      if (response.status === 401) {
        throw new Error(
          "Your AirHacks login session has expired. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Flight search failed (HTTP ${response.status}).`
        );
      }

      if (!Array.isArray(data.offers)) {
        throw new Error(
          "The backend response did not contain flight offers."
        );
      }

      if (activeRequest.current === controller) {
        setOffers(data.offers);
      }

      return data.offers;
    } catch (err) {
      if (controller.signal.aborted) {
        return [];
      }

      if (activeRequest.current === controller) {
        setError(
          err instanceof TypeError
            ? `Could not connect to the AirHacks backend at ${API_BASE_URL}.`
            : err.message || "Unable to search flights."
        );
      }

      return [];
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }

  return {
    offers,
    loading,
    error,
    searchFlights,
  };
}
