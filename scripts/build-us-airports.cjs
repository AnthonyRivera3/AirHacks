
const fs = require("node:fs");
const path = require("node:path");

const SOURCE =
  "https://davidmegginson.github.io/ourairports-data/airports.csv";

const STATES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  PR: "Puerto Rico",
  VI: "U.S. Virgin Islands",
  GU: "Guam",
  AS: "American Samoa",
  MP: "Northern Mariana Islands",
};

// Parse quoted CSV fields, including names with commas.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !quoted
    ) {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }

      row.push(field);

      if (row.some((value) => value !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

async function main() {
  console.log("Downloading airport data...");

  const response = await fetch(SOURCE);

  if (!response.ok) {
    throw new Error(
      `Airport download failed: HTTP ${response.status}`
    );
  }

  const rows = parseCSV(await response.text());
  const headers = rows.shift().map((header) =>
    header.replace(/^\uFEFF/, "")
  );

  const indexes = Object.fromEntries(
    headers.map((header, index) => [header, index])
  );

  const get = (row, column) =>
    row[indexes[column]] ?? "";

  const grouped = new Map(
    Object.keys(STATES).map((code) => [
      code,
      new Map(),
    ])
  );

  for (const row of rows) {
    const country = get(row, "iso_country");
    const region = get(row, "iso_region");

    const state =
      country === "US" && region.startsWith("US-")
        ? region.slice(3)
        : country;

    if (!grouped.has(state)) continue;

    const iata = get(row, "iata_code")
      .trim()
      .toUpperCase();

    if (!/^[A-Z]{3}$/.test(iata)) continue;

    // Only airports reporting scheduled airline service.
    if (get(row, "scheduled_service") !== "yes") {
      continue;
    }

    if (get(row, "type").startsWith("closed")) {
      continue;
    }

    grouped.get(state).set(iata, {
      code: iata,
      name: get(row, "name"),
      city: get(row, "municipality"),
    });
  }

  const result = Object.entries(STATES)
    .map(([code, name]) => ({
      code,
      name,
      airports: [...grouped.get(code).values()].sort(
        (a, b) =>
          (a.city || a.name).localeCompare(
            b.city || b.name
          ) || a.code.localeCompare(b.code)
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const outputPath = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "components",
    "pages",
    "search_flights",
    "usAirports.json"
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(result, null, 2),
    "utf8"
  );

  const count = result.reduce(
    (total, state) => total + state.airports.length,
    0
  );

  console.log(
    `Saved ${count} airports across ${result.length} states and territories.`
  );
  console.log(`File: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
