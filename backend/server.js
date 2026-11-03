
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

const SEARCHAPI_URL = "https://www.searchapi.io/api/v1/search";
const CACHE_MS = 30_000;
const searchCache = new Map();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "AirHacks backend is running!" });
});

function validDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function money(value) {
  if (value == null || value === "") return null;

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : null;
}

function httpsUrl(value) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeAirport(airport) {
  return {
    code: airport?.id || null,
    name: airport?.name || null,
    city: airport?.city || null,
    date: airport?.date || null,
    time: airport?.time || null,
  };
}

function normalizeBookingPart(part) {
  if (!part || typeof part !== "object") return null;

  return {
    provider: part.book_with || "Booking provider",
    price: money(part.price),
    bookingUrl: httpsUrl(part.tracking_link),
  };
}

function normalizeItineraries(data) {
  return data.itineraries.map((itinerary, itineraryIndex) => ({
    id: String(itinerary.id ?? itineraryIndex),

    total_amount: money(itinerary.price),
    total_currency: "USD",

    slices: (
      Array.isArray(itinerary.legs) ? itinerary.legs : []
    ).map((leg, legIndex) => ({
      id: `${itineraryIndex}-${legIndex}`,

      departure: normalizeAirport(leg.departure_airport),
      arrival: normalizeAirport(leg.arrival_airport),

      duration_minutes:
        leg.total_duration != null &&
        Number.isFinite(Number(leg.total_duration))
          ? Number(leg.total_duration)
          : null,

      stop_count: Number.isInteger(leg.stops)
        ? leg.stops
        : Array.isArray(leg.flights)
          ? Math.max(0, leg.flights.length - 1)
          : null,

      segments: (
        Array.isArray(leg.flights) ? leg.flights : []
      ).map((flight) => ({
        departure: normalizeAirport(flight.departure_airport),
        arrival: normalizeAirport(flight.arrival_airport),

        airline_name: flight.airline || null,
        operating_airline: flight.operating_airline || null,
        airline_code: flight.airline_code || null,
        airline_logo: httpsUrl(flight.airline_logo),
        flight_number: flight.flight_number || null,
        duration_minutes: money(flight.duration),
      })),
    })),

    booking_options: (
      Array.isArray(itinerary.booking_options)
        ? itinerary.booking_options
        : []
    ).map((option) => ({
      provider: option.book_with || "Booking provider",
      price: money(option.price),
      isSplit: Boolean(option.is_split_booking),

      bookingUrl: option.is_split_booking
        ? null
        : httpsUrl(option.tracking_link),

      departure: option.is_split_booking
        ? normalizeBookingPart(option.departure)
        : null,

      arrival: option.is_split_booking
        ? normalizeBookingPart(option.arrival)
        : null,
    })),
  }));
}

function providerError(data) {
  const detail =
    data?.error?.message ||
    (typeof data?.error === "string" ? data.error : null) ||
    data?.errors?.[0]?.message ||
    data?.message;

  if (typeof detail !== "string") {
    return "SearchAPI could not complete this flight search.";
  }

  return detail
    .replaceAll(
      process.env.SEARCHAPI_API_KEY || "__no_key__",
      "[redacted]"
    )
    .slice(0, 250);
}

app.post("/api/flights/search", async (req, res) => {
  const body = req.body || {};

  const origin =
    typeof body.origin === "string"
      ? body.origin.trim().toUpperCase()
      : "";

  const destination =
    typeof body.destination === "string"
      ? body.destination.trim().toUpperCase()
      : "";

  const departureDate = body.departureDate;
  const returnDate = body.returnDate;

  const tripType =
    body.tripType || (returnDate ? "round-trip" : "one-way");

  const adults = Number(
    body.adults ?? body.passengers ?? 1
  );

  const children = Number(body.children ?? 0);
  const infants = Number(body.infants ?? 0);

  const cabins = {
    economy: "economy",
    premium_economy: "premium_economy",
    premiumeconomy: "premium_economy",
    business: "business",
    first: "first_class",
    first_class: "first_class",
  };

  const cabinKey = String(body.cabinClass || "economy")
    .trim()
    .toLowerCase()
    .replace(/[ -]/g, "_");

  const travelClass = cabins[cabinKey];

  if (
    !/^[A-Z]{3}$/.test(origin) ||
    !/^[A-Z]{3}$/.test(destination)
  ) {
    return res.status(400).json({
      error:
        "Enter three-letter airport or city IATA codes, such as JFK and LON.",
    });
  }

  if (origin === destination) {
    return res.status(400).json({
      error: "Origin and destination must be different.",
    });
  }

  if (!validDate(departureDate)) {
    return res.status(400).json({
      error: "Enter a valid departure date (YYYY-MM-DD).",
    });
  }

  if (!["one-way", "round-trip"].includes(tripType)) {
    return res.status(400).json({
      error: "Choose one-way or round-trip.",
    });
  }

  if (
    tripType === "round-trip" &&
    (!validDate(returnDate) || returnDate < departureDate)
  ) {
    return res.status(400).json({
      error: "Return date must be on or after departure date.",
    });
  }

  if (tripType === "one-way" && returnDate) {
    return res.status(400).json({
      error: "One-way searches cannot include a return date.",
    });
  }

  if (
    !Number.isInteger(adults) ||
    adults < 1 ||
    adults > 8 ||
    children !== 0 ||
    infants !== 0
  ) {
    return res.status(400).json({
      error:
        "This Skyscanner API supports 1–8 adults; child and infant searches are not supported.",
    });
  }

  if (!travelClass) {
    return res.status(400).json({
      error:
        "Choose Economy, Premium Economy, Business, or First.",
    });
  }

  if (
    body.currency &&
    String(body.currency).toUpperCase() !== "USD"
  ) {
    return res.status(400).json({
      error:
        "This Skyscanner API currently provides prices in USD only.",
    });
  }

  if (!process.env.SEARCHAPI_API_KEY) {
    return res.status(500).json({
      error:
        "SEARCHAPI_API_KEY is missing from backend/.env.",
    });
  }

  const params = new URLSearchParams({
    engine: "skyscanner_flights",
    departure_id: origin,
    arrival_id: destination,
    outbound_date: departureDate,
    flight_type:
      tripType === "round-trip" ? "round_trip" : "one_way",
    travel_class: travelClass,
    adults: String(adults),
  });

  if (tripType === "round-trip") {
    params.set("return_date", returnDate);
  }

  const cacheKey = params.toString();
  const cached = searchCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return res.json({
      ...cached.response,
      cached: true,
    });
  }

  if (cached) {
    searchCache.delete(cacheKey);
  }

  try {
    const response = await fetch(
      `${SEARCHAPI_URL}?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.SEARCHAPI_API_KEY}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(65000),
      }
    );

    const rawText = await response.text();
    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        error: "SearchAPI returned a non-JSON response.",
      });
    }

    if (!response.ok || data?.error || data?.errors) {
      const status = response.ok ? 502 : response.status;

      return res.status(status).json({
        error: providerError(data),
      });
    }

    if (!Array.isArray(data?.itineraries)) {
      return res.status(502).json({
        error:
          "SearchAPI returned an unexpected response; no itineraries array was found.",
      });
    }

    const offers = normalizeItineraries(data);

    const payload = {
      offers,
      count: offers.length,
      tripType,
      currency: "USD",
    };

    // Short cache to avoid immediate duplicate trial searches.
    // Confirm caching is permitted by your provider's terms.
    if (searchCache.size >= 50) {
      searchCache.delete(searchCache.keys().next().value);
    }

    searchCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_MS,
      response: payload,
    });

    console.log(
      `SearchAPI returned ${offers.length} itineraries for ${origin}-${destination}.`
    );

    return res.json(payload);
  } catch (error) {
    const timedOut =
      error?.name === "TimeoutError" ||
      error?.name === "AbortError";

    console.error(
      "SearchAPI request error:",
      error?.name || "UnknownError"
    );

    return res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? "The flight search took too long. Please retry."
        : "Could not contact SearchAPI. Check the backend connection.",
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `AirHacks backend running at http://localhost:${PORT}`
    );
  });
}

module.exports = {
  app,
  normalizeItineraries,
};
