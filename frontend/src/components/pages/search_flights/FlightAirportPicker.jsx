
import { useId, useState } from "react";
import usAirports from "./usAirports.json";

export default function FlightAirportPicker({
  label,
  value,
  onChange,
}) {
  const [selectedState, setSelectedState] =
    useState("");

  const stateId = useId();
  const airportId = useId();

  const stateData = usAirports.find(
    (state) => state.code === selectedState
  );

  const airports = stateData?.airports || [];

  function handleStateChange(event) {
    setSelectedState(event.target.value);

    // Clear the previous airport when the state changes.
    onChange("");
  }

  return (
    <div className="flight-airport-picker">
      <label
        className="flight-field"
        htmlFor={stateId}
      >
        <span>{label} — State</span>

        <select
          id={stateId}
          value={selectedState}
          onChange={handleStateChange}
          required
        >
          <option value="">
            Select a state
          </option>

          {usAirports.map((state) => (
            <option
              key={state.code}
              value={state.code}
              disabled={state.airports.length === 0}
            >
              {state.name}
            </option>
          ))}
        </select>
      </label>

      <label
        className="flight-field"
        htmlFor={airportId}
      >
        <span>{label} — Airport</span>

        <select
          id={airportId}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          disabled={!selectedState || !airports.length}
          required
        >
          <option value="">
            {selectedState
              ? "Select an airport"
              : "Choose a state first"}
          </option>

          {airports.map((airport) => (
            <option
              key={airport.code}
              value={airport.code}
            >
              {airport.city
                ? `${airport.city} — `
                : ""}
              {airport.name} ({airport.code})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
