
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "AirHacks backend is running!" });
});

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

    // Validate the required search fields.
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        error: "Enter an origin, destination, and departure date.",
      });
    }

    if (
      !/^[A-Za-z]{3}$/.test(origin) ||
      !/^[A-Za-z]{3}$/.test(destination)
    ) {
      return res.status(400).json({
        error: "Use three-letter airport codes, such as JFK and LHR.",
      });
    }

    if (origin.toUpperCase() === destination.toUpperCase()) {
      return res.status(400).json({
        error: "Origin and destination must be different.",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
      return res.status(400).json({
        error: "Choose a valid departure date.",
      });
    }

    if (
      returnDate &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(returnDate) ||
        returnDate < departureDate)
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

    const allowedCabins = [
      "economy",
      "premium_economy",
      "business",
      "first",
    ];

    if (!allowedCabins.includes(cabinClass)) {
      return res.status(400).json({
        error: "Choose a valid cabin class.",
      });
    }

    if (!process.env.DUFFEL_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "Duffel API token is not configured on the server.",
      });
    }

    const slices = [
      {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departure_date: departureDate,
      },
    ];

    // A second slice represents the return journey.
    if (returnDate) {
      slices.push({
        origin: destination.toUpperCase(),
        destination: origin.toUpperCase(),
        departure_date: returnDate,
      });
    }

    const duffelResponse = await fetch(
      "https://api.duffel.com/air/offer_requests?return_offers=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Duffel-Version": "v2",
        },
        body: JSON.stringify({
          data: {
            slices,
            passengers: Array.from(
              { length: passengerCount },
              () => ({ type: "adult" })
            ),
            cabin_class: cabinClass,
          },
        }),
      }
    );

    const result = await duffelResponse.json();

    if (!duffelResponse.ok) {
      console.error("Duffel API error:", result);
      return res.status(duffelResponse.status).json({
        error:
          result.errors?.[0]?.message ||
          "Duffel could not complete the flight search.",
      });
    }

    const offers = result.data?.offers || [];

    return res.json({
      offers,
      count: offers.length,
      liveMode: result.data?.live_mode ?? false,
    });
  } catch (error) {
    console.error("Flight search error:", error);
    return res.status(500).json({
      error: "Unable to search flights right now. Please try again.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
