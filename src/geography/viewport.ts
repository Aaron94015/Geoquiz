import { geoArea, geoCentroid, geoDistance } from "d3-geo";

type Geometry = {
  type: string;
  coordinates?: any;
  geometries?: Geometry[];
};

type Feature = {
  type: "Feature";
  properties?: unknown;
  geometry: Geometry | null;
};

const NEARBY_RADIANS = (8 * Math.PI) / 180;
const SUBSTANTIAL_COMPONENT = 0.2;

const polygonFeatures = (source: Feature): Feature[] => {
  if (!source.geometry) return [];
  if (source.geometry.type === "Polygon") return [source];
  if (source.geometry.type !== "MultiPolygon") return [source];
  return (source.geometry.coordinates ?? []).map((coordinates: any) => ({
    type: "Feature",
    properties: source.properties,
    geometry: { type: "Polygon", coordinates },
  }));
};

const rings = (feature: Feature): [number, number][] =>
  feature.geometry?.type === "Polygon"
    ? (feature.geometry.coordinates?.[0] ?? [])
    : [];

const radius = (feature: Feature, center: [number, number]) =>
  rings(feature).reduce(
    (maximum, coordinate) =>
      Math.max(maximum, geoDistance(center, coordinate as [number, number])),
    0,
  );

/**
 * Makes a geometry used only for fitting the map. Every country's largest
 * component is retained, while nearby islands and substantial secondary
 * components are also retained. Distant overseas territories no longer make
 * an otherwise compact region appear tiny.
 */
export function focusFeatureCollection(features: Feature[]) {
  const countries = features.map((source) => {
    const parts = polygonFeatures(source)
      .map((feature) => ({
        feature,
        area: geoArea(feature as any),
        center: geoCentroid(feature as any) as [number, number],
      }))
      .sort((a, b) => b.area - a.area);
    const largestArea = parts[0]?.area ?? 0;
    return parts.map((part, index) => ({
      ...part,
      radius: radius(part.feature, part.center),
      included: index === 0 || part.area >= largestArea * SUBSTANTIAL_COMPONENT,
    }));
  });

  const parts = countries.flat();
  // Grow the main geographic cluster to include normal island chains. This is
  // deliberately iterative: one island can bridge the next in an archipelago.
  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of parts.filter((part) => !part.included)) {
      if (
        parts.some(
          (included) =>
            included.included &&
            included !== candidate &&
            geoDistance(included.center, candidate.center) <=
              included.radius + candidate.radius + NEARBY_RADIANS,
        )
      ) {
        candidate.included = true;
        changed = true;
      }
    }
  }

  return {
    type: "FeatureCollection" as const,
    features: parts.filter((part) => part.included).map((part) => part.feature),
  };
}

export type MarkerPoint<T> = { item: T; anchor: [number, number] };

/** Places 44px touch targets without changing the projected country shapes. */
export function layoutMarkerPoints<T>(
  points: MarkerPoint<T>[],
  width: number,
  height: number,
  minimumDistance = 46,
) {
  const margin = minimumDistance / 2;
  const placed: Array<MarkerPoint<T> & { point: [number, number] }> = [];
  for (const entry of points) {
    let point: [number, number] = [...entry.anchor];
    const available = (candidate: [number, number]) =>
      placed.every(
        ({ point: other }) =>
          Math.hypot(candidate[0] - other[0], candidate[1] - other[1]) >=
          minimumDistance,
      );
    if (!available(point)) {
      search: for (let distance = 8; distance <= 120; distance += 8) {
        for (let angleIndex = 0; angleIndex < 16; angleIndex += 1) {
          const angle = (angleIndex * Math.PI * 2) / 16;
          const candidate: [number, number] = [
            Math.max(
              margin,
              Math.min(
                width - margin,
                entry.anchor[0] + Math.cos(angle) * distance,
              ),
            ),
            Math.max(
              margin,
              Math.min(
                height - margin,
                entry.anchor[1] + Math.sin(angle) * distance,
              ),
            ),
          ];
          if (available(candidate)) {
            point = candidate;
            break search;
          }
        }
      }
    }
    placed.push({ ...entry, point });
  }
  return placed;
}
