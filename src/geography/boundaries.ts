import { feature } from "topojson-client";
import type { Feature, Geometry, MultiPolygon, Polygon } from "geojson";
import type {
  GeometryCollection,
  Objects,
  Topology,
} from "topojson-specification";
import topologyData from "world-atlas/countries-50m.json";
import { allCountries, type Country, type Region } from "../data/geography";

type BoundaryProperties = { name?: string };
export type BoundaryGeometry = Polygon | MultiPolygon;
export type BoundaryFeature = Feature<BoundaryGeometry, BoundaryProperties>;

interface WorldObjects extends Objects<BoundaryProperties> {
  countries: GeometryCollection<BoundaryProperties>;
}
type WorldTopology = Topology<WorldObjects>;

/** Validate the imported atlas at the untyped JSON/module boundary. */
function assertWorldTopology(value: unknown): asserts value is WorldTopology {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    value.type !== "Topology" ||
    !("arcs" in value) ||
    !Array.isArray(value.arcs) ||
    !("objects" in value) ||
    typeof value.objects !== "object" ||
    value.objects === null ||
    !("countries" in value.objects)
  ) {
    throw new Error("The world atlas does not contain a countries topology");
  }
  const countries = value.objects.countries;
  if (
    typeof countries !== "object" ||
    countries === null ||
    !("type" in countries) ||
    countries.type !== "GeometryCollection" ||
    !("geometries" in countries) ||
    !Array.isArray(countries.geometries) ||
    !countries.geometries.every(
      (geometry) =>
        typeof geometry === "object" &&
        geometry !== null &&
        "type" in geometry &&
        (geometry.type === "Polygon" || geometry.type === "MultiPolygon"),
    )
  ) {
    throw new Error("The countries topology contains unexpected geometry");
  }
}

const isBoundaryFeature = (
  candidate: Feature<Geometry, BoundaryProperties>,
): candidate is BoundaryFeature =>
  candidate.geometry.type === "Polygon" ||
  candidate.geometry.type === "MultiPolygon";

assertWorldTopology(topologyData);
const atlasFeatures = feature(
  topologyData,
  topologyData.objects.countries,
).features;
if (!atlasFeatures.every(isBoundaryFeature)) {
  throw new Error("The generated country boundaries are not polygonal");
}

const normalized = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
const byName = new Map(
  atlasFeatures.map((boundary) => [
    normalized(boundary.properties?.name ?? ""),
    boundary,
  ]),
);

export const boundaryFor = (country: Country): BoundaryFeature | undefined =>
  [country.name, ...(country.aliases ?? [])]
    .map(normalized)
    .map((name) => byName.get(name))
    .find((boundary) => boundary !== undefined);

type CountryBoundary = { country: Country; feature: BoundaryFeature };

export const featuresFor = (region: Region): CountryBoundary[] =>
  region.countries
    .map((country) => ({ country, feature: boundaryFor(country) }))
    .filter((item): item is CountryBoundary => item.feature !== undefined);

export const missingBoundaries = () =>
  allCountries.filter((country) => !boundaryFor(country));
