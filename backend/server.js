
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const API_BASE_URL =
  process.env.TRAVELPORT_API_BASE_URL ||
  "https://api.pp.travelport.net/11/air";

let cachedAccessToken = null;
let tokenExpiresAt = 0;

app.get("/", (req, res) => {
  res.json({
    message: "AirHacks backend is running with Travelport!",
  });
});

// Get and cache a Travelport access token.
async function getTravelportToken() {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const {
    TRAVELPORT_AUTH_URL,
    TRAVELPORT_USERNAME,
    TRAVELPORT_PASSWORD,
    TRAVELPORT_CLIENT_ID,
    TRAVELPORT_CLIENT_SECRET,
  } = process.env;

  const missing = [
    ["TRAVELPORT_AUTH_URL", TRAVELPORT_AUTH_URL],
    ["TRAVELPORT_USERNAME", TRAVELPORT_USERNAME],
    ["TRAVELPORT_PASSWORD", TRAVELPORT_PASSWORD],
    ["TRAVELPORT_CLIENT_ID", TRAVELPORT_CLIENT_ID],
    ["TRAVELPORT_CLIENT_SECRET", TRAVELPORT_CLIENT_SECRET],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing Travelport environment variables: ${missing.join(", ")}`
    );
  }

  const response = await fetch(TRAVELPORT_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "password",
      username: TRAVELPORT_USERNAME,
      password: TRAVELPORT_PASSWORD,
      client_id: TRAVELPORT_CLIENT_ID,
      client_secret: TRAVELPORT_CLIENT_SECRET,
    }),
  });

  const responseText = await response.text();
  let data;

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = {};
  }

  if (!response.ok || !data.access_token) {
    // Never log credentials or the access token.
    console.error("Travelport authentication failed:", {
      status: response.status,
      error: data.error_description || data.error || "Authentication failed",
    });

    throw new Error("Travelport authentication failed.");
  }

  cachedAccessToken = data.access_token;

  const expiresIn = Number(data.expires_in || 86400);
  tokenExpiresAt = Date.now() + expiresIn * 1000;

  return cachedAccessToken;
}

app.post("/api/flights/search", async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      cabinClass = "economy",
    } = req.body;

    // Validate required fields.
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        error: "Enter an origin, destination, and departure date.",
      });
    }

    if (
      typeof origin !== "string" ||
      typeof destination !== "string" ||
      !/^[A-Za-z]{3}$/.test(origin) ||
      !/^[A-Za-z]{3}$/.test(destination)
    ) {
      return res.status(400).json({
        error: "Use three-letter airport codes, such as JFK and LAX.",
      });
    }

    const originCode = origin.toUpperCase();
    const destinationCode = destination.toUpperCase();

    if (originCode === destinationCode) {
      return res.status(400).json({
        error: "Origin and destination must be different.",
      });
    }

    const isValidDate = (value) => {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (!isValidDate(departureDate)) {
      return res.status(400).json({
        error: "Choose a valid departure date.",
      });
    }

    if (
      returnDate &&
      (!isValidDate(returnDate) || returnDate < departureDate)
    ) {
      return res.status(400).json({
        error: "Return date must be on or after departure date.",
      });
    }

    const passengerCount = Number(passengers);

    if (
      !Number.isInteger(passengerCount) ||
      passengerCount < 1 ||
      passengerCount > 9
    ) {
      return res.status(400).json({
        error: "Passenger count must be between 1 and 9.",
      });
    }

    const cabinMap = {
      economy: "Economy",
      premium_economy: "PremiumEconomy",
      business: "Business",
      first: "First",
    };

    if (!cabinMap[cabinClass]) {
      return res.status(400).json({
        error: "Choose a valid cabin class.",
      });
    }

    const pcc = process.env.TRAVELPORT_PCC;

    if (!pcc) {
      return res.status(500).json({
        error: "TRAVELPORT_PCC is missing from backend/.env.",
      });
    }

    const token = await getTravelportToken();

    const searchCriteriaFlight = [
      {
        "@type": "SearchCriteriaFlight",
        departureDate,
        From: { value: originCode },
        To: { value: destinationCode },
      },
    ];

    if (returnDate) {
      searchCriteriaFlight.push({
        "@type": "SearchCriteriaFlight",
        departureDate: returnDate,
        From: { value: destinationCode },
        To: { value: originCode },
      });
    }

    // Request structure based on the Travelport example you provided.
    const requestBody = {
      "@type": "CatalogProductOfferingsQueryRequest",
      CatalogProductOfferingsRequest: {
        "@type": "CatalogProductOfferingsRequestAir",
        maxNumberOfUpsellsToReturn: 4,
        contentSourceList: ["NDC"],
        PassengerCriteria: [
          {
            "@type": "PassengerCriteria",
            number: passengerCount,
            passengerTypeCode: "ADT",
          },
        ],
        SearchCriteriaFlight: searchCriteriaFlight,
        SearchModifiersAir: {
          "@type": "SearchModifiersAir",
          CabinPreference: [
            {
              "@type": "CabinPreference",
              preferenceType: "Preferred",
              cabins: [cabinMap[cabinClass]],
            },
          ],
        },
      },
    };

    const traceId = `AirHacks-${Date.now()}`;

    const response = await fetch(
      `${API_BASE_URL}/catalog/search/catalogproductofferings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "TVP-PCC-Core": pcc,
          TraceId: traceId,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const responseText = await response.text();
    let data;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { rawResponse: responseText };
    }

    // Return detailed provider errors for troubleshooting.
    if (!response.ok) {
      console.error(
        "Travelport search failed:",
        JSON.stringify(
          {
            status: response.status,
            traceId,
            response: data,
          },
          null,
          2
        )
      );

      const apiResult =
        data?.CatalogProductOfferingsResponse?.Result ??
        data?.Result;

      const errors = apiResult?.Error;
      const firstError = Array.isArray(errors) ? errors[0] : errors;

      const errorMessage =
        firstError?.Message ||
        firstError?.message ||
        firstError?.description ||
        data?.message ||
        `Travelport search failed with HTTP ${response.status}.`;

      return res.status(response.status).json({
        error: errorMessage,
        provider: "Travelport",
        traceId,
        details: apiResult || data,
      });
    }

    return res.json({
      provider: "Travelport",
      traceId,
      data,
    });
  } catch (error) {
    console.error("Flight search error:", error.message);

    const isConfigurationError = error.message.startsWith(
      "Missing Travelport environment variables:"
    );

    return res.status(500).json({
      error:
        isConfigurationError ||
        error.message === "Travelport authentication failed."
          ? error.message
          : "Unable to search flights right now. Check the backend terminal.",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `AirHacks Travelport backend running at http://localhost:${PORT}`
  );
});
