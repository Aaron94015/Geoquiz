import {
  continentById,
  regions,
  type ContinentId,
  type Region,
} from "../data/geography";
import { GeoMap } from "../components/GeoMap";
export function RegionScreen({
  continentId,
  onChoose,
  onBack,
}: {
  continentId: ContinentId;
  onChoose: (r: Region) => void;
  onBack: () => void;
}) {
  const continent = continentById(continentId);
  const choices = regions.filter((r) => continent.regionIds.includes(r.id));
  return (
    <main className="screen region-screen">
      <button className="back" onClick={onBack}>
        ← Continents
      </button>
      <header>
        <span className="eyebrow">{continent.name}</span>
        <h1>Choose a region</h1>
        <p>Tap the map or a region name to begin.</p>
      </header>
      <GeoMap
        regions={choices}
        onRegion={onChoose}
        label={`${continent.name} regions`}
      />
      <div className="region-list">
        {choices.map((r, i) => (
          <button key={r.id} onClick={() => onChoose(r)}>
            <i className={`swatch swatch-${i}`} aria-hidden="true" />
            <span>
              <strong>{r.name}</strong>
              <small>
                {r.countries.length} countries ·{" "}
                {Math.min(10, r.countries.length)} questions
              </small>
            </span>
            <b aria-hidden="true">›</b>
          </button>
        ))}
      </div>
    </main>
  );
}
