
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

const SEARCHAPI_URL = "https://www.searchapi.io/api/v1/search";
const CACHE_MS = 30_000;
const searchCache = new Map();

// Allow the React frontend to send and receive
// the verified login session cookie.
app.use(
  cors({
    origin:
      process.env.FRONTEND_ORIGIN ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// ========================================
// AIRHACKS AUTHENTICATION
// ========================================
// Keep these routes BEFORE all /api/flights routes.

const { authRouter, requireAuth } = require("./auth");

// Username/password and email verification endpoints.
app.use("/api/auth", authRouter);

// Require a verified session for flight searches
// and discounted-flight searches.
app.use("/api/flights", requireAuth);

// ========================================
// BACKEND STATUS
// ========================================

app.get("/", (_req, res) => {
  res.json({
    message: "AirHacks backend is running!",
  });
});

// ========================================
// FORMATTING AND VALIDATION HELPERS
// ========================================

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

// ========================================
// NORMALIZE SKYSCANNER FLIGHT RESULTS
// ========================================

function normalizeItineraries(data) {
  return data.itineraries.map((itinerary, itineraryIndex) => ({
    id: String(itinerary.id ?? itineraryIndex),

    total_amount: money(itinerary.price),
    total_currency: "USD",

    slices: (
      Array.isArray(itinerary.legs)
        ? itinerary.legs
        : []
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
        Array.isArray(leg.flights)
          ? leg.flights
          : []
      ).map((flight) => ({
        departure: normalizeAirport(flight.departure_airport),
        arrival: normalizeAirport(flight.arrival_airport),

        airline_name: flight.airline || null,
        operating_airline:
          flight.operating_airline || null,
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
    (typeof data?.error === "string"
      ? data.error
      : null) ||
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

// ========================================
// SKYSCANNER FLIGHT SEARCH
// ========================================

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
    body.tripType ||
    (returnDate ? "round-trip" : "one-way");

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

  const cabinKey = String(
    body.cabinClass || "economy"
  )
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
    (!validDate(returnDate) ||
      returnDate < departureDate)
  ) {
    return res.status(400).json({
      error:
        "Return date must be on or after departure date.",
    });
  }

  if (tripType === "one-way" && returnDate) {
    return res.status(400).json({
      error:
        "One-way searches cannot include a return date.",
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
      tripType === "round-trip"
        ? "round_trip"
        : "one_way",
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
          Authorization:
            `Bearer ${process.env.SEARCHAPI_API_KEY}`,
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
        error:
          "SearchAPI returned a non-JSON response.",
      });
    }

    if (
      !response.ok ||
      data?.error ||
      data?.errors
    ) {
      const status = response.ok
        ? 502
        : response.status;

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
      searchCache.delete(
        searchCache.keys().next().value
      );
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

// ========================================
// GOOGLE FLIGHTS DEALS
// ========================================

const DEALS_CACHE_MS = 60 * 60 * 1000;
const dealsCache = new Map();
const pendingDealRequests = new Map();

function validDealPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : null;
}

function safeDealUrl(value) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      !["google.com", "www.google.com"].includes(
        url.hostname
      ) ||
      !url.pathname.startsWith("/travel/flights")
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function safeDealImage(value) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function normalizeFlightDeal(deal) {
  const price = validDealPrice(deal?.price);
  const destination = deal?.destination;

  if (!price || !destination?.name) {
    return null;
  }

  const typicalPrice = validDealPrice(
    deal.typical_price
  );

  const savingsAmount =
    typicalPrice !== null &&
    typicalPrice > price
      ? Math.max(0, typicalPrice - price)
      : null;

  const suppliedPercent = Number(
    deal.savings_percentage
  );

  const savingsPercentage =
    savingsAmount !== null
      ? Number.isFinite(suppliedPercent) &&
        suppliedPercent > 0 &&
        suppliedPercent < 100
        ? suppliedPercent
        : Math.round(
            (savingsAmount / typicalPrice) * 100
          )
      : null;

  return {
    id: String(
      deal.position ??
        `${destination.name}-${deal.outbound_date}`
    ),

    destination: destination.name,
    country: destination.country || "",
    destinationCode:
      destination.airport_code || "",
    destinationImage:
      safeDealImage(destination.image),
    description: destination.description || "",
    tagline: destination.tagline || "",

    originCode:
      deal.origin?.airport_code || "",

    outboundDate: deal.outbound_date || null,
    returnDate: deal.return_date || null,

    tripLengthDays:
      Number.isInteger(deal.trip_length_days)
        ? deal.trip_length_days
        : null,

    price,
    typicalPrice,
    savingsAmount,
    savingsPercentage,

    airline:
      deal.airline || "Airline unavailable",
    airlineCode: deal.airline_code || "",

    stops:
      Number.isInteger(deal.stops)
        ? deal.stops
        : null,

    duration: deal.flight_duration || "",

    isRoundTrip:
      Boolean(deal.is_round_trip),
    bookingUrl:
      safeDealUrl(deal.booking_link),
  };
}

async function requestFlightDeals(origin) {
  const params = new URLSearchParams({
    engine: "google_flights_deals",
    departure_id: origin,
    flight_type: "round_trip",
    travel_class: "economy",
    currency: "USD",
    hl: "en-US",
    gl: "US",
  });

  const response = await fetch(
    `https://www.searchapi.io/api/v1/search?${params}`,
    {
      headers: {
        Authorization:
          `Bearer ${process.env.SEARCHAPI_API_KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(60000),
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  if (
    !response.ok ||
    data?.error ||
    data?.errors
  ) {
    const error = new Error(
      response.status === 429
        ? "Flight deals provider rate limit reached."
        : "Could not retrieve flight deals from SearchAPI."
    );

    error.status =
      response.status === 429 ? 429 : 502;

    throw error;
  }

  if (!Array.isArray(data?.deals)) {
    const error = new Error(
      "The flight deals provider returned an unexpected response."
    );

    error.status = 502;
    throw error;
  }

  const deals = data.deals
    .map(normalizeFlightDeal)
    .filter(Boolean);

  const payload = {
    origin,
    currency: "USD",
    tripType: "round-trip",
    passengers: 1,
    fetchedAt: new Date().toISOString(),
    deals,
    count: deals.length,
  };

  // Keep a small cache of departure airports.
  if (dealsCache.size >= 40) {
    dealsCache.delete(
      dealsCache.keys().next().value
    );
  }

  dealsCache.set(origin, {
    expiresAt:
      Date.now() + DEALS_CACHE_MS,
    payload,
  });

  return payload;
}

app.get("/api/flights/deals", async (req, res) => {
  const origin =
    typeof req.query.origin === "string"
      ? req.query.origin.trim().toUpperCase()
      : "JFK";

  if (!/^[A-Z]{3}$/.test(origin)) {
    return res.status(400).json({
      error:
        "Select a valid departure airport.",
    });
  }

  if (!process.env.SEARCHAPI_API_KEY) {
    return res.status(503).json({
      error:
        "SearchAPI key is not configured.",
    });
  }

  const cached = dealsCache.get(origin);

  if (
    cached &&
    cached.expiresAt > Date.now()
  ) {
    return res.json({
      ...cached.payload,
      cached: true,
    });
  }

  try {
    // Share one upstream request when multiple
    // visitors request the same airport at once.
    if (!pendingDealRequests.has(origin)) {
      const pending = requestFlightDeals(
        origin
      ).finally(() => {
        pendingDealRequests.delete(origin);
      });

      pendingDealRequests.set(
        origin,
        pending
      );
    }

    const payload =
      await pendingDealRequests.get(origin);

    return res.json({
      ...payload,
      cached: false,
    });
  } catch (error) {
    console.error(
      "Flight deals request failed:",
      error.message
    );

    return res
      .status(error.status || 502)
      .json({
        error:
          error.status === 429
            ? "Too many requests to the flight deals provider. Try again later."
            : "Flight deals are temporarily unavailable. Please try again.",
      });
  }
});

// ========================================
// START AIRHACKS SERVER
// ========================================

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
