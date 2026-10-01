import { geoBounds } from "d3-geo";
import { describe, expect, it } from "vitest";
import {
  focusFeatureCollection,
  layoutMarkerPoints,
  type MapFeature,
} from "./viewport";

const square = (west: number, south: number, size = 2) => [
  [
    [west, south],
    [west, south + size],
    [west + size, south + size],
    [west + size, south],
    [west, south],
  ],
];

describe("focusFeatureCollection", () => {
  it("ignores a small distant overseas component when fitting", () => {
    const franceLike = {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: [square(0, 45, 8), square(-54, 3, 2)],
      },
    } satisfies MapFeature;
    const nearbyCountry = {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "Polygon", coordinates: square(9, 47, 3) },
    } satisfies MapFeature;

    const focus = focusFeatureCollection([franceLike, nearbyCountry]);

    expect(focus.features).toHaveLength(2);
    expect(geoBounds(focus as any)[0][0]).toBeGreaterThan(-1);
  });

  it("keeps large secondary islands", () => {
    const islandCountry = {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: [square(0, 0, 4), square(30, 0, 3)],
      },
    } satisfies MapFeature;
    expect(focusFeatureCollection([islandCountry]).features).toHaveLength(2);
  });
});

describe("layoutMarkerPoints", () => {
  it("separates overlapping 44px tap targets", () => {
    const markers = layoutMarkerPoints(
      [
        { item: "a", anchor: [100, 100] },
        { item: "b", anchor: [102, 101] },
        { item: "c", anchor: [99, 102] },
      ],
      800,
      540,
    );
    for (const marker of markers)
      for (const other of markers)
        if (marker !== other)
          expect(
            Math.hypot(
              marker.point[0] - other.point[0],
              marker.point[1] - other.point[1],
            ),
          ).toBeGreaterThanOrEqual(46);
  });
});
