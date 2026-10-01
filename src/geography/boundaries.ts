import { feature } from "topojson-client";
import type { ExtendedFeature, GeoGeometryObjects } from "d3-geo";
import topology from "world-atlas/countries-50m.json";
import { allCountries, type Country, type Region } from "../data/geography";

type GeoFeature = ExtendedFeature<
  GeoGeometryObjects,
  { name?: string } | null
>;
const collection = feature(
  topology as never,
  (topology as any).objects.countries,
) as unknown as { features: GeoFeature[] };
const normalized = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
const byName = new Map(
  collection.features.map((f) => [normalized(f.properties?.name ?? ""), f]),
);
export const boundaryFor = (country: Country) =>
  [country.name, ...(country.aliases ?? [])]
    .map(normalized)
    .map((n) => byName.get(n))
    .find(Boolean);
export const featuresFor = (region: Region) =>
  region.countries
    .map((country) => ({ country, feature: boundaryFor(country) }))
    .filter((item) => item.feature);
export const missingBoundaries = () =>
  allCountries.filter((country) => !boundaryFor(country));
