import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { geoEqualEarth, geoMercator, geoPath, type GeoProjection } from "d3-geo";
import type { Country, Region } from "../data/geography";
import { featuresFor } from "../geography/boundaries";
import { atlasSections, boundsFeature, sectionContains, type AtlasSection } from "../geography/atlas";
import { constrainTransform, isDeliberateTap, MAX_SCALE, movedBeyondTap, resolveCountryHit, type Point, type ViewTransform } from "../geography/interaction";
import { markerCoordinates } from "../geography/markers";
import { focusFeatureCollection, layoutMarkerPoints } from "../geography/viewport";

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
type MapItem = ReturnType<typeof featuresFor>[number] & { region: Region };
type RenderSection = AtlasSection & { projection: GeoProjection; items: MapItem[] };
type Marker = { country: Country; anchor: [number, number]; point: [number, number] };
type Gesture = {
  starts: Map<number, Point>;
  points: Map<number, Point>;
  moved: boolean;
  pinched: boolean;
  viewStart: ViewTransform;
  pinchDistance?: number;
  pinchCenter?: Point;
};

const WIDTH = 800;
const HEIGHT = 540;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
const OVERVIEW: ViewTransform = { x: 0, y: 0, scale: 1 };

const pointerPoint = (event: PointerEvent<SVGSVGElement>): Point => ({ x: event.clientX, y: event.clientY });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function makeSections(items: MapItem[], regionId?: string): RenderSection[] {
  const configured = regionId ? atlasSections(regionId) : undefined;
  const definitions: readonly AtlasSection[] = configured ?? [{ id: "main", label: "Map", rect: { x: 18, y: 18, width: 764, height: 504 } }];
  return definitions.map((section) => {
    const sectionItems = items.filter(({ country }) => sectionContains(section, country.code));
    const projection = section.bounds ? geoMercator() : geoEqualEarth();
    const fit = section.bounds ? boundsFeature(section.bounds) : focusFeatureCollection(sectionItems.map(({ feature }) => feature));
    projection.fitExtent(
      [[section.rect.x + 9, section.rect.y + 9], [section.rect.x + section.rect.width - 9, section.rect.y + section.rect.height - 9]],
      fit,
    );
    return { ...section, projection, items: sectionItems };
  });
}

export function GeoMap({ regions, activeRegionId, interactiveCountries = false, selectedCode, targetCode, answered = false, onCountry, onRegion, label }: Props) {
  const titleId = useId();
  const clipPrefix = useId().replaceAll(":", "");
  const svgRef = useRef<SVGSVGElement>(null);
  const gesture = useRef<Gesture | undefined>(undefined);
  const [view, setView] = useState<ViewTransform>(OVERVIEW);
  const items = useMemo(() => regions.flatMap((region) => featuresFor(region).map((item) => ({ ...item, region }))), [regions]);
  const sections = useMemo(() => makeSections(items, regions.length === 1 ? regions[0].id : undefined), [items, regions]);
  const markers = useMemo<Marker[]>(() => sections.flatMap((section) => {
    const points = section.items
      .filter(({ country }) => markerCoordinates[country.code])
      .map(({ country }) => ({ item: country, anchor: section.projection(markerCoordinates[country.code]) ?? [0, 0] }));
    return layoutMarkerPoints(points, WIDTH, HEIGHT).map(({ item, anchor, point }) => ({ country: item, anchor, point }));
  }), [sections]);

  useEffect(() => {
    if (answered) setView(OVERVIEW);
  }, [answered]);

  const choose = (country: Country) => {
    if (!answered) onCountry?.(country);
  };
  const keyboardChoose = (event: KeyboardEvent, country: Country) => {
    if (!answered && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      choose(country);
    }
  };
  const mapPoint = (event: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const local = point.matrixTransform(matrix.inverse());
    return {
      x: (local.x - CENTER.x - view.x) / view.scale + CENTER.x,
      y: (local.y - CENTER.y - view.y) / view.scale + CENTER.y,
    };
  };
  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!interactiveCountries || answered) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerPoint(event);
    if (!gesture.current) gesture.current = { starts: new Map(), points: new Map(), moved: false, pinched: false, viewStart: view };
    gesture.current.starts.set(event.pointerId, point);
    gesture.current.points.set(event.pointerId, point);
    if (gesture.current.points.size === 2) {
      const [a, b] = [...gesture.current.points.values()];
      gesture.current.pinched = true;
      gesture.current.pinchDistance = distance(a, b);
      gesture.current.pinchCenter = midpoint(a, b);
      gesture.current.viewStart = view;
    }
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const current = gesture.current;
    if (!current?.points.has(event.pointerId)) return;
    const point = pointerPoint(event);
    current.points.set(event.pointerId, point);
    const start = current.starts.get(event.pointerId);
    if (start && movedBeyondTap(start, point)) current.moved = true;
    if (current.points.size === 2 && current.pinchDistance && current.pinchCenter) {
      const [a, b] = [...current.points.values()];
      const center = midpoint(a, b);
      const scale = current.viewStart.scale * distance(a, b) / current.pinchDistance;
      setView(constrainTransform({ scale, x: current.viewStart.x + (center.x - current.pinchCenter.x), y: current.viewStart.y + (center.y - current.pinchCenter.y) }, WIDTH, HEIGHT));
    } else if (current.points.size === 1 && current.viewStart.scale > 1 && start) {
      setView(constrainTransform({ ...current.viewStart, x: current.viewStart.x + point.x - start.x, y: current.viewStart.y + point.y - start.y }, WIDTH, HEIGHT));
    }
  };
  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    const current = gesture.current;
    if (!current) return;
    const wasTap = isDeliberateTap(current.points.size, current.moved, current.pinched);
    current.points.delete(event.pointerId);
    current.starts.delete(event.pointerId);
    if (!current.points.size) gesture.current = undefined;
    else if (current.points.size === 1) {
      const [remainingId, remainingPoint] = [...current.points.entries()][0];
      current.starts.set(remainingId, remainingPoint);
      current.viewStart = view;
    }
    if (!wasTap || answered) return;
    if (event.target instanceof SVGElement && event.target.closest(".zoom-controls")) return;
    const target = event.target instanceof SVGElement ? event.target.closest<SVGElement>("[data-country]") : null;
    const actual = target ? items.find(({ country }) => country.code === target.dataset.country)?.country : undefined;
    const point = mapPoint(event);
    const helperHits = point ? markers.map((marker) => ({ item: marker.country, distance: Math.hypot(marker.point[0] - point.x, marker.point[1] - point.y) })) : [];
    const renderedWidth = svgRef.current?.getBoundingClientRect().width ?? WIDTH;
    const helperRadius = (22 * WIDTH) / renderedWidth / view.scale;
    const country = resolveCountryHit(actual, helperHits, helperRadius);
    if (country) choose(country);
  };
  const transform = `translate(${view.x} ${view.y}) translate(${CENTER.x} ${CENTER.y}) scale(${view.scale}) translate(${-CENTER.x} ${-CENTER.y})`;

  return (
    <svg ref={svgRef} className={`geo-map ${view.scale > 1 ? "is-zoomed" : ""}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="group" aria-labelledby={titleId}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { gesture.current = undefined; }}>
      <title id={titleId}>{label}</title>
      <rect className="ocean" width={WIDTH} height={HEIGHT} rx="26" />
      <defs>{sections.map((section) => <clipPath key={section.id} id={`${clipPrefix}-${section.id}`}><rect {...section.rect} rx={section.inset ? 13 : 20} /></clipPath>)}</defs>
      <g className="map-viewport" transform={transform}>
        {sections.map((section) => {
          const path = geoPath(section.projection);
          return <g key={section.id} className={section.inset ? "atlas-section inset" : "atlas-section"}>
            <rect className="section-ocean" {...section.rect} rx={section.inset ? 13 : 20} />
            <g clipPath={`url(#${clipPrefix}-${section.id})`}>
              {section.items.map(({ country, feature, region }) => {
                const d = path(feature) ?? "";
                const state = answered && country.code === targetCode ? "correct" : answered && country.code === selectedCode ? "incorrect" : "";
                return <g key={`${section.id}-${region.id}-${country.code}`} className={`country-group ${state}`}>
                  <path d={d} className={`country region-${regions.indexOf(region) % 5}`} aria-hidden="true" />
                  {interactiveCountries ? <path d={d} className="country-hit" data-country={country.code} role="button" tabIndex={answered ? -1 : 0} aria-label={country.name} onKeyDown={(event) => keyboardChoose(event, country)} />
                    : <path d={d} className={`region-hit ${activeRegionId === region.id ? "active" : ""}`} role="button" tabIndex={0} aria-label={`Choose ${region.name}`} onClick={() => onRegion?.(region)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onRegion?.(region); } }} />}
                </g>;
              })}
            </g>
            {section.inset && <text className="inset-label" x={section.rect.x + 10} y={section.rect.y + 18}>{section.label}</text>}
          </g>;
        })}
        {interactiveCountries && markers.map(({ country, anchor, point }, index) => {
          const state = answered && country.code === targetCode ? "correct" : answered && country.code === selectedCode ? "incorrect" : "";
          return <g key={`marker-${country.code}-${index}`} className={`marker ${state}`} transform={`translate(${point[0]},${point[1]})`} aria-hidden="true">
            {(point[0] !== anchor[0] || point[1] !== anchor[1]) && <line className="marker-leader" x1={anchor[0] - point[0]} y1={anchor[1] - point[1]} x2="0" y2="0" />}
            <circle className="marker-ring" r="16" /><circle className="marker-dot" r="5" />
          </g>;
        })}
      </g>
      {interactiveCountries && !answered && <g className="zoom-controls" aria-label="Map zoom controls">
        <g role="button" tabIndex={0} aria-label="Zoom in" onClick={() => setView((current) => constrainTransform({ ...current, scale: Math.min(MAX_SCALE, current.scale * 1.6) }, WIDTH, HEIGHT))} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setView((current) => constrainTransform({ ...current, scale: Math.min(MAX_SCALE, current.scale * 1.6) }, WIDTH, HEIGHT)); }}><circle cx="755" cy="455" r="22" /><text x="755" y="462">+</text></g>
        <g role="button" tabIndex={0} aria-label="Reset zoom" onClick={() => setView(OVERVIEW)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setView(OVERVIEW); }}><circle cx="755" cy="505" r="22" /><text x="755" y="510">1×</text></g>
      </g>}
    </svg>
  );
}
