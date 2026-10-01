import { useId, useMemo } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import type { Country, Region } from "../data/geography";
import { featuresFor } from "../geography/boundaries";
import { markerCoordinates } from "../geography/markers";
import {
  focusFeatureCollection,
  layoutMarkerPoints,
} from "../geography/viewport";

type Props = {
  regions: Region[];
  activeRegionId?: string;
  interactiveCountries?: boolean;
  selectedCode?: string;
  targetCode?: string;
  answered?: boolean;
  onCountry?: (country: Country) => void;
  onRegion?: (region: Region) => void;
  label: string;
};
const WIDTH = 800,
  HEIGHT = 540;

export function GeoMap({
  regions,
  activeRegionId,
  interactiveCountries = false,
  selectedCode,
  targetCode,
  answered,
  onCountry,
  onRegion,
  label,
}: Props) {
  const titleId = useId();
  const items = useMemo(
    () =>
      regions.flatMap((region) =>
        featuresFor(region).map((x) => ({ ...x, region })),
      ),
    [regions],
  );
  const projection = useMemo(() => {
    const p = geoEqualEarth();
    const fc = focusFeatureCollection(items.map((x) => x.feature));
    if (items.length)
      p.fitExtent(
        [
          [36, 28],
          [WIDTH - 36, HEIGHT - 28],
        ],
        fc,
      );
    return p;
  }, [items]);
  const path = geoPath(projection);
  const markers = useMemo(
    () =>
      layoutMarkerPoints(
        regions
          .flatMap((r) => r.countries)
          .filter((country) => markerCoordinates[country.code])
          .map((item) => ({
            item,
            anchor: projection(markerCoordinates[item.code]) ?? [0, 0],
          })),
        WIDTH,
        HEIGHT,
      ),
    [projection, regions],
  );
  return (
    <svg
      className="geo-map"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="group"
      aria-labelledby={titleId}
    >
      <title id={titleId}>{label}</title>
      <rect className="ocean" width={WIDTH} height={HEIGHT} rx="26" />
      {items.map(({ country, feature, region }) => {
        const d = path(feature) ?? "";
        const isSelected = answered && country.code === selectedCode;
        const isTarget = answered && country.code === targetCode;
        const state = isTarget ? "correct" : isSelected ? "incorrect" : "";
        return (
          <g
            key={`${region.id}-${country.code}`}
            className={`country-group ${state}`}
          >
            <path
              d={d}
              className={`country region-${regions.indexOf(region) % 5}`}
              aria-hidden="true"
            />
            {interactiveCountries && (
              <path
                d={d}
                className="country-hit"
                role="button"
                tabIndex={answered ? -1 : 0}
                aria-label={country.name}
                onClick={() => !answered && onCountry?.(country)}
                onKeyDown={(e) => {
                  if (!answered && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onCountry?.(country);
                  }
                }}
              />
            )}
            {!interactiveCountries && (
              <path
                d={d}
                className={`region-hit ${activeRegionId === region.id ? "active" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`Choose ${region.name}`}
                onClick={() => onRegion?.(region)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRegion?.(region);
                  }
                }}
              />
            )}
          </g>
        );
      })}
      {interactiveCountries &&
        markers.map(({ item: country, anchor, point }) => {
          const state =
            answered && country.code === targetCode
              ? "correct"
              : answered && country.code === selectedCode
                ? "incorrect"
                : "";
          return (
            <g
              key={`marker-${country.code}`}
              className={`marker ${state}`}
              transform={`translate(${point[0]},${point[1]})`}
              onClick={() => !answered && onCountry?.(country)}
              role="button"
              tabIndex={answered ? -1 : 0}
              aria-label={country.name}
              onKeyDown={(e) => {
                if (!answered && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onCountry?.(country);
                }
              }}
            >
              {(point[0] !== anchor[0] || point[1] !== anchor[1]) && (
                <line
                  className="marker-leader"
                  x1={anchor[0] - point[0]}
                  y1={anchor[1] - point[1]}
                  x2="0"
                  y2="0"
                />
              )}
              <circle className="marker-hit" r="22" />
              <circle className="marker-ring" r="16" />
              <circle className="marker-dot" r="5" />
            </g>
          );
        })}
    </svg>
  );
}
