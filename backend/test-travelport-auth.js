
require("dotenv").config();

async function testTravelportAuth() {
  const required = [
    "TRAVELPORT_USERNAME",
    "TRAVELPORT_PASSWORD",
    "TRAVELPORT_CLIENT_ID",
    "TRAVELPORT_CLIENT_SECRET",
    "TRAVELPORT_AUTH_URL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error("Missing .env variables:", missing.join(", "));
    process.exitCode = 1;
    return;
  }

  const body = new URLSearchParams({
    grant_type: "password",
    username: process.env.TRAVELPORT_USERNAME,
    password: process.env.TRAVELPORT_PASSWORD,
    client_id: process.env.TRAVELPORT_CLIENT_ID,
    client_secret: process.env.TRAVELPORT_CLIENT_SECRET,
  });

  try {
    const response = await fetch(process.env.TRAVELPORT_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Travelport authentication failed.");
      console.error("HTTP status:", response.status);
      console.error("API error:", data.error_description || data.error || "No details returned");
      process.exitCode = 1;
      return;
    }

    if (!data.access_token) {
      console.error("Response received, but no access token was returned.");
      process.exitCode = 1;
      return;
    }

    console.log("Travelport authentication successful!");
    console.log("Token type:", data.token_type || "Not specified");
    console.log("Expires in:", data.expires_in ?? "Not specified", "seconds");
    console.log("Access token received (value hidden).");
  } catch (error) {
    console.error("Could not connect to Travelport:", error.message);
    process.exitCode = 1;
  }
}

testTravelportAuth();
