
require("dotenv").config();

async function main() {
  const apiKey = process.env.FLIGHTAPI_KEY;

  if (!apiKey) {
    console.error("FLIGHTAPI_KEY is missing from backend/.env");
    process.exitCode = 1;
    return;
  }

  const url = [
    "https://api.flightapi.io/onewaytrip",
    encodeURIComponent(apiKey),
    "JFK",
    "LAX",
    "2026-12-12",
    "1",
    "0",
    "0",
    "Economy",
    "USD",
  ].join("/");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30000),
    });

    const text = await response.text();

    console.log("HTTP status:", response.status);

    try {
      const data = JSON.parse(text);
      console.log(JSON.stringify(data, null, 2));
    } catch {
      console.log("Response was not JSON.");
      console.log(text.slice(0, 1500));
    }

    if (!response.ok) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Request failed:", error.message);
    process.exitCode = 1;
  }
}

main();
