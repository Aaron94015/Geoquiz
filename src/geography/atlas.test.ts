import { describe, expect, it } from "vitest";
import { atlasSections, sectionContains } from "./atlas";

describe("atlas inset configuration", () => {
  it("keeps the continental North America section large and moves remote states to insets", () => {
    const sections = atlasSections("north-america-mainland")!;
    expect(sections[0].rect.width).toBeGreaterThan(500);
    expect(sections.map((section) => section.id)).toEqual(["main", "alaska", "hawaii"]);
  });

  it("gives eastern Russia an inset instead of shrinking Eastern Europe", () => {
    const sections = atlasSections("europe-east")!;
    expect(sections[0].bounds?.east).toBeLessThan(50);
    expect(sectionContains(sections[1], "RUS")).toBe(true);
  });

  it("places every unified Oceania country in a compact section", () => {
    const sections = atlasSections("oceania")!;
    const codes = ["AUS", "NZL", "FJI", "PNG", "SLB", "VUT", "FSM", "KIR", "MHL", "NRU", "PLW", "WSM", "TON", "TUV"];
    expect(sections).toHaveLength(4);
    for (const code of codes) expect(sections.some((section) => sectionContains(section, code))).toBe(true);
  });
});
