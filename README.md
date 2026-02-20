# FindMyBird

A bird-finding web app built for **ConUHacks**. Discover recent bird sightings and hotspots near you on an interactive map, powered by the eBird API.

## Features

- **Interactive map** — View recent bird observations and eBird hotspots in your area
- **Location search** — Use your current location or search by latitude/longitude
- **Adjustable radius** — Set how far (in km) to search for birds and hotspots
- **Bird details** — Tap a sighting to see species info and photos when available
- **Hotspots** — Browse top birding spots and see what’s been reported there

## Tech stack

- **Next.js 16** (App Router) with **TypeScript**
- **React 19** with **Tailwind CSS**
- **Leaflet** / **react-leaflet** for the map
- **eBird API** for recent observations and hotspot data

## Getting started

### Prerequisites

- Node.js 18+
- npm (or yarn / pnpm)

### Run locally

1. Clone the repo and go into the web app:

   ```bash
   cd findmybird/web
   ```

2. Install dependencies (eBird/Leaflet peer deps may need the flag below):

   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment (optional)

If you use an eBird API key, set it in `web/.env.local` (see `web/app/api/ebird/*` routes for how it’s used). The app may work with the public eBird API without a key for basic usage.

## Project structure

```
findmybird/
├── web/                 # Next.js app
│   ├── app/             # Pages, layout, API routes
│   │   ├── api/ebird/   # eBird proxy (recent, hotspots, photo)
│   │   └── page.tsx     # Main map + bird list
│   ├── components/      # Map, bird modal, games, etc.
│   ├── hooks/           # e.g. useGeolocation
│   ├── lib/             # Types, constants, utils
│   └── public/          # Static assets (e.g. birds.csv)
├── README.md            # This file
└── ...
```

More detail: see `web/ARCHITECTURE.md` and `web/SETUP.md`.

## Scripts (from `web/`)

| Command            | Description              |
|--------------------|--------------------------|
| `npm run dev`      | Start dev server         |
| `npm run build`     | Production build         |
| `npm run start`     | Run production server    |
| `npm run lint`      | Run ESLint               |
| `npm run format`    | Format with Prettier     |

## License

MIT — see [LICENSE](LICENSE). You can use, copy, and modify this code.
