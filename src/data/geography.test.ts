import { describe, expect, it } from "vitest";
import { allCountries, continents, regionById, regions } from "./geography";
describe("geographic taxonomy", () => {
  it("contains 197 uniquely assigned entries", () => {
    expect(allCountries).toHaveLength(197);
    expect(new Set(allCountries.map((c) => c.code)).size).toBe(197);
  });
  it("uses the approved North American grouping", () => {
    const region = regionById("north-america-mainland")!;
    expect(region.name).toBe("North American Mainland");
    expect(region.countries.map((c) => c.name)).toEqual([
      "Canada",
      "Mexico",
      "United States",
    ]);
  });
  it("has one 12-country South America region", () => {
    const continent = continents.find((c) => c.id === "south-america")!;
    expect(continent.regionIds).toEqual(["south-america"]);
    expect(regionById("south-america")?.countries).toHaveLength(12);
  });
  it("assigns all regions to their declared continent", () => {
    for (const c of continents)
      expect(
        c.regionIds.every(
          (id) => regions.find((r) => r.id === id)?.continentId === c.id,
        ),
      ).toBe(true);
  });
});
