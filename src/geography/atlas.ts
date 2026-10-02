import type { Feature, Polygon } from "geojson";

export type MapRect = { x: number; y: number; width: number; height: number };
export type GeographicBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};
export type AtlasSection = {
  id: string;
  label: string;
  rect: MapRect;
  bounds?: GeographicBounds;
  countryCodes?: readonly string[];
  inset?: boolean;
};

const layouts: Record<string, readonly AtlasSection[]> = {
  "north-america-mainland": [
    { id: "main", label: "Continental North America", rect: { x: 18, y: 18, width: 588, height: 504 }, bounds: { west: -130, south: 14, east: -52, north: 73 } },
    { id: "alaska", label: "Alaska", rect: { x: 620, y: 18, width: 162, height: 235 }, bounds: { west: -180, south: 49, east: -125, north: 73 }, countryCodes: ["USA"], inset: true },
    { id: "hawaii", label: "Hawaii", rect: { x: 620, y: 269, width: 162, height: 253 }, bounds: { west: -161.5, south: 18, east: -154, north: 23 }, countryCodes: ["USA"], inset: true },
  ],
  "europe-east": [
    { id: "main", label: "Eastern Europe", rect: { x: 18, y: 18, width: 550, height: 504 }, bounds: { west: 11, south: 39, east: 47, north: 62 } },
    { id: "russia", label: "Russia · eastern extent", rect: { x: 582, y: 92, width: 200, height: 356 }, bounds: { west: 40, south: 40, east: 180, north: 79 }, countryCodes: ["RUS"], inset: true },
  ],
  oceania: [
    { id: "australasia", label: "Australia & New Zealand", rect: { x: 18, y: 18, width: 472, height: 316 }, bounds: { west: 108, south: -49, east: 180, north: -8 }, countryCodes: ["AUS", "NZL"] },
    { id: "melanesia", label: "Melanesia", rect: { x: 504, y: 18, width: 278, height: 316 }, bounds: { west: 130, south: -26, east: 180, north: 2 }, countryCodes: ["PNG", "FJI", "SLB", "VUT"], inset: true },
    { id: "micronesia", label: "Micronesia", rect: { x: 18, y: 348, width: 370, height: 174 }, bounds: { west: 130, south: -3, east: 180, north: 15 }, countryCodes: ["FSM", "MHL", "NRU", "PLW", "TUV"], inset: true },
    { id: "polynesia", label: "Polynesia & Kiribati", rect: { x: 402, y: 348, width: 380, height: 174 }, bounds: { west: -180, south: -26, east: -150, north: 15 }, countryCodes: ["KIR", "WSM", "TON"], inset: true },
  ],
};

export function atlasSections(regionId: string): readonly AtlasSection[] | undefined {
  return layouts[regionId];
}

export function boundsFeature(bounds: GeographicBounds): Feature<Polygon> {
  const { west, south, east, north } = bounds;
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[[west, south], [west, north], [east, north], [east, south], [west, south]]] } };
}

export function sectionContains(section: AtlasSection, code: string) {
  return !section.countryCodes || section.countryCodes.includes(code);
}
