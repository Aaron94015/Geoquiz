import { describe, expect, it } from "vitest";
import { constrainTransform, isDeliberateTap, resolveCountryHit } from "./interaction";

describe("map interaction", () => {
  it("allows a deliberate tap but rejects a pan and pinch", () => {
    expect(isDeliberateTap(1, false, false)).toBe(true);
    expect(isDeliberateTap(1, true, false)).toBe(false);
    expect(isDeliberateTap(1, false, true)).toBe(false);
    expect(isDeliberateTap(2, false, true)).toBe(false);
  });

  it("gives rendered geometry priority over overlapping helpers", () => {
    expect(resolveCountryHit("France", [{ item: "Monaco", distance: 1 }])).toBe("France");
  });

  it("uses the nearest helper over empty ocean", () => {
    expect(resolveCountryHit(undefined, [{ item: "Monaco", distance: 12 }, { item: "Liechtenstein", distance: 18 }])).toBe("Monaco");
    expect(resolveCountryHit(undefined, [{ item: "Monaco", distance: 30 }])).toBeUndefined();
  });

  it("constrains scale and prevents the map being dragged away", () => {
    expect(constrainTransform({ scale: 20, x: 99999, y: -99999 }, 800, 540)).toEqual({ scale: 8, x: 2800, y: -1890 });
  });
});
