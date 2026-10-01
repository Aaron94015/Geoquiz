import { continents, type ContinentId } from "../data/geography";
const icons: Record<ContinentId, string> = {
  africa: "◒",
  asia: "◓",
  europe: "◐",
  "north-america": "◔",
  "south-america": "◕",
  oceania: "◉",
};
export function ContinentScreen({
  onChoose,
}: {
  onChoose: (id: ContinentId) => void;
}) {
  return (
    <main className="screen selection">
      <header className="hero">
        <span className="eyebrow">Explore the world</span>
        <h1>Geoquiz</h1>
        <p>How well do you know the map?</p>
      </header>
      <section aria-labelledby="choose-continent">
        <h2 id="choose-continent">Choose a continent</h2>
        <div className="continent-grid">
          {continents.map((continent) => (
            <button
              className="continent-card"
              key={continent.id}
              onClick={() => onChoose(continent.id)}
            >
              <span className="continent-icon" aria-hidden="true">
                {icons[continent.id]}
              </span>
              <span>{continent.name}</span>
              <small>
                {continent.regionIds.length === 1
                  ? "12 countries"
                  : `${continent.regionIds.length} regions`}
              </small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
