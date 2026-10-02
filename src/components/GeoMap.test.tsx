import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { regionById } from "../data/geography";
import { GeoMap } from "./GeoMap";

afterEach(cleanup);

describe("GeoMap", () => {
  it("renders selectable inset countries and preserves answer feedback", () => {
    const onCountry = vi.fn();
    const region = regionById("oceania")!;
    const { rerender } = render(<GeoMap regions={[region]} interactiveCountries onCountry={onCountry} label="Oceania quiz" />);
    const kiribati = screen.getByRole("button", { name: "Kiribati" });
    fireEvent.keyDown(kiribati, { key: "Enter" });
    expect(onCountry).toHaveBeenCalledWith(expect.objectContaining({ code: "KIR" }));
    rerender(<GeoMap regions={[region]} interactiveCountries selectedCode="KIR" targetCode="AUS" answered onCountry={onCountry} label="Oceania quiz" />);
    expect(document.querySelectorAll(".country-group.correct").length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".country-group.incorrect").length).toBeGreaterThan(0);
  });

  it("returns to overview after an answer and stays there for the next question", () => {
    const region = regionById("europe-west")!;
    const { rerender, container } = render(<GeoMap regions={[region]} interactiveCountries label="Europe quiz" />);
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(container.querySelector(".map-viewport")?.getAttribute("transform")).toContain("scale(1.6)");
    rerender(<GeoMap regions={[region]} interactiveCountries answered selectedCode="FRA" targetCode="FRA" label="Europe quiz" />);
    expect(container.querySelector(".map-viewport")?.getAttribute("transform")).toContain("scale(1)");
    rerender(<GeoMap regions={[region]} interactiveCountries targetCode="BEL" label="Europe quiz" />);
    expect(container.querySelector(".map-viewport")?.getAttribute("transform")).toContain("scale(1)");
  });
});
