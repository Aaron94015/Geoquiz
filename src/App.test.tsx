import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
vi.mock("./components/GeoMap", () => ({
  GeoMap: ({ regions, onCountry, onRegion }: any) => (
    <div data-testid="map">
      {onRegion &&
        regions.map((r: any) => (
          <button key={r.id} onClick={() => onRegion(r)}>
            {r.name} map
          </button>
        ))}
      {onCountry &&
        regions[0].countries.map((c: any) => (
          <button key={c.code} onClick={() => onCountry(c)}>
            {c.name}
          </button>
        ))}
    </div>
  ),
}));
describe("core flow", () => {
  it("skips region selection for South America", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /South America/ }));
    expect(screen.getByText(/Question 1 of 10/)).toBeInTheDocument();
    expect(screen.queryByText("Choose a region")).not.toBeInTheDocument();
  });
  it("requires Next after answering", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /North America/ }));
    await user.click(
      screen.getAllByRole("button", { name: /North American Mainland/ })[0],
    );
    const target = screen.getByRole("heading", { level: 1 }).textContent!;
    await user.click(screen.getByRole("button", { name: target }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Next|See results/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
  });
});
