import { allCountries, continents, regions } from "../src/data/geography";
import { boundaryFor } from "../src/geography/boundaries";
import { markerCoordinates } from "../src/geography/markers";
const errors: string[] = [];
const codes = new Set<string>();
if (allCountries.length !== 197)
  errors.push(`Expected 197 playable entries, found ${allCountries.length}.`);
for (const country of allCountries) {
  if (codes.has(country.code))
    errors.push(`${country.code} is assigned more than once.`);
  codes.add(country.code);
  if (!boundaryFor(country) && !markerCoordinates[country.code])
    errors.push(`${country.name} has neither boundary geometry nor a marker.`);
}
for (const continent of continents) {
  for (const id of continent.regionIds) {
    const region = regions.find((r) => r.id === id);
    if (!region)
      errors.push(`${continent.name} references unknown region ${id}.`);
    else if (region.continentId !== continent.id)
      errors.push(`${region.name} belongs to the wrong continent.`);
  }
}
for (const region of regions) {
  if (!region.countries.length) errors.push(`${region.name} is empty.`);
  const local = new Set(region.countries.map((c) => c.code));
  if (local.size !== region.countries.length)
    errors.push(`${region.name} contains duplicate entries.`);
  const expected = Math.min(10, region.countries.length);
  if (expected < 1 || expected > 10)
    errors.push(`${region.name} has invalid quiz length.`);
}
const south = regions.find((r) => r.id === "south-america");
if (south?.countries.length !== 12)
  errors.push("South America must contain 12 countries.");
const mainland = regions.find((r) => r.id === "north-america-mainland");
if (mainland?.name !== "North American Mainland")
  errors.push("North American Mainland has the wrong name.");
if (errors.length) {
  console.error(`Geography validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(
  `Geography valid: ${continents.length} continents, ${regions.length} regions, ${allCountries.length} playable entries.`,
);
