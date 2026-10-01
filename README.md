# Geoquiz

Geoquiz is a mobile-first country-location game. Choose a continent and geographic region, then tap each requested country on a map made from real Natural Earth boundaries. Every quiz uses all countries in a region up to a maximum of ten, without repeats.

## Features

- Six continent choices and 22 coherent geographic regions.
- South America starts immediately as its single continent-wide region.
- Responsive SVG maps with individually selectable country geometry.
- Enlarged transparent hit areas and geographic markers for small states and islands.
- Immediate correct/incorrect highlighting followed by an explicit **Next** action.
- Actual score denominators, replay, and region/continent navigation.
- Keyboard-operable map targets, visible focus, safe-area support, and reduced-motion support.
- No API key, paid map service, server, account, or database.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally <http://localhost:5173>).

To preview a production build:

```bash
npm run build
npm run preview
```

## Checks

```bash
npm run validate:geography
npm test
npm run test:e2e
npm run build
```

`validate:geography` checks the 197-entry taxonomy for duplicate assignments, invalid regions, missing boundary/marker coverage, the approved South America count, and the North American Mainland name.

## Architecture

- **React + TypeScript + Vite** provide the static client application.
- `src/data/geography.ts` is the declarative continent, region, and country taxonomy.
- `src/features/quiz/quiz.ts` owns shuffle, question selection, answer locking, advancement, and scoring independently of the UI.
- `src/geography/` resolves country metadata to map features and stores explicit marker locations.
- `src/components/GeoMap.tsx` uses D3 geographic projection/path utilities and TopoJSON to render responsive SVG maps.
- `src/screens/` contains the continent, region, quiz, and results experiences.
- `scripts/validate-geography.ts` enforces geographic-data invariants.

The app is entirely static. Boundary data is installed locally through the `world-atlas` package and is bundled into the production assets; there are no runtime map requests.

## Geographic data and attribution

Country geometry comes from [Natural Earth](https://www.naturalearthdata.com/) Admin 0 data at 1:50m scale, distributed in TopoJSON form by the open-source [`world-atlas`](https://github.com/topojson/world-atlas) package. Natural Earth data is in the public domain. The application uses `topojson-client` to decode topology and `d3-geo` to project and fit selected features.

Visible country shapes use the dataset geometry. Transparent strokes enlarge interaction targets without changing the displayed boundaries. Very small countries and dispersed islands also receive a marker with a phone-friendly target.

## Geographic policy

Geoquiz uses a stable gameplay taxonomy of 197 playable geographic entries: the 193 UN member states plus Palestine, Vatican City, Kosovo, and Taiwan. Their inclusion is for geographic quiz play and is not a statement about diplomatic recognition.

- Ordinary dependencies and overseas territories are not separate answers in version 1.
- Disputed boundaries follow the pinned Natural Earth representation; Geoquiz does not redraw them.
- Western Sahara is not a separate playable answer in version 1.
- Transcontinental entries appear once: Russia in Europe; Türkiye, Cyprus, Armenia, Azerbaijan, Georgia, and Kazakhstan in Asia; Egypt in Africa.
- Mexico belongs to the gameplay grouping **North American Mainland**, alongside Canada and the United States. The label is not intended to represent the formal UN statistical subregion “Northern America.”
- South America is one 12-country region. Choosing it skips a redundant region screen and starts a ten-question quiz sampled without replacement.

See `src/data/geography.ts` for the complete, authoritative taxonomy.

## Quiz rule

The number of questions is:

```ts
Math.min(10, region.countries.length);
```

The region list is shuffled with Fisher–Yates and sliced once when a game starts. A country therefore cannot repeat in the same quiz. **Play Again** stays in the same region and creates a fresh shuffle.
