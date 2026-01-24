# Leaflet Map Implementation

## Overview

Interactive map feature using Leaflet + react-leaflet with browser geolocation. The map requests user location on page load and displays it with a 15km radius circle.

## Dependencies

Added to `package.json`:
- `leaflet`: ^1.9.4 - Core Leaflet library
- `react-leaflet`: ^4.2.1 - React bindings for Leaflet
- `@types/leaflet`: ^1.9.8 - TypeScript types for Leaflet

**Install with:**
```bash
npm install
```

## Architecture

### File Structure

```
hooks/
└── useGeolocation.ts          # Geolocation hook with full permission handling

components/
└── map/
    ├── MapContainer.tsx       # Main container (handles geolocation state)
    ├── MapView.tsx            # Leaflet MapContainer wrapper
    ├── UserMarker.tsx         # Marker at user location
    └── RadiusCircle.tsx       # 15km radius circle

app/
└── (routes)/
    └── map/
        └── page.tsx           # Server component with dynamic import
```

## Key Components

### 1. `useGeolocation` Hook

**Location:** `hooks/useGeolocation.ts`

**Responsibilities:**
- Requests browser geolocation permission on mount
- Handles all permission states:
  - `loading`: Requesting location
  - `permissionDenied`: User denied permission
  - `error`: Location unavailable or other errors
  - Success: Returns `latitude` and `longitude`

**Returns:**
```typescript
{
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}
```

### 2. `MapContainer` Component

**Location:** `components/map/MapContainer.tsx`

**Responsibilities:**
- Uses `useGeolocation` hook
- Renders appropriate UI for each state:
  - Loading spinner while requesting location
  - Permission denied message with refresh button
  - Error message with retry button
  - Map view on success

### 3. `MapView` Component

**Location:** `components/map/MapView.tsx`

**Responsibilities:**
- Wraps Leaflet's `MapContainer`
- Configures OpenStreetMap tile layer (no API key required)
- Provides map container for child components

### 4. `UserMarker` Component

**Location:** `components/map/UserMarker.tsx`

**Responsibilities:**
- Displays marker at user's exact location
- Fixes Leaflet default marker icon issue in Next.js
- Shows popup with coordinates

### 5. `RadiusCircle` Component

**Location:** `components/map/RadiusCircle.tsx`

**Responsibilities:**
- Renders a 15,000 meter (15km) radius circle
- Styled with blue color and semi-transparent fill

## Key Decisions

### 1. Dynamic Import with SSR Disabled

**Why:** Leaflet uses browser-only APIs (window, document) that aren't available during server-side rendering.

**Implementation:**
```typescript
const MapContainer = dynamic(
  () => import("@/components/map/MapContainer").then((mod) => mod.MapContainer),
  { ssr: false }
);
```

### 2. Client Components

**Why:** Geolocation API and Leaflet require browser APIs.

**Implementation:** All map-related components use `"use client"` directive.

### 3. OpenStreetMap Tiles

**Why:** No API key required, free to use, reliable.

**Implementation:** Uses standard OSM tile server URL.

### 4. Marker Icon Fix

**Why:** Next.js webpack configuration breaks Leaflet's default marker icon paths.

**Implementation:** Manually sets icon URLs using CDN (unpkg.com) in `UserMarker` component.

### 5. Permission State Handling

**Why:** Users may deny permission or location may be unavailable.

**Implementation:** Comprehensive error handling with user-friendly messages and retry options.

## Styling

### CSS Imports

Leaflet CSS is imported in `app/globals.css`:
```css
@import "leaflet/dist/leaflet.css";
```

### Map Styling

- Map fills viewport: `h-screen w-screen`
- Loading/error states: Centered with Tailwind CSS
- Circle styling: Blue color (#3b82f6) with 10% opacity

## Usage

1. Navigate to `/map` route
2. Browser will request location permission
3. On permission grant:
   - Map centers on user location
   - Marker shows exact position
   - 15km radius circle is displayed
4. On permission deny:
   - Shows friendly message
   - Provides refresh button to retry

## Testing

To test different scenarios:

1. **Allow permission**: Map should display with your location
2. **Deny permission**: Should show permission denied message
3. **Disable location services**: Should show error message
4. **Test on mobile**: Geolocation works on mobile browsers

## Browser Compatibility

- Modern browsers with Geolocation API support
- Chrome, Firefox, Safari, Edge (desktop and mobile)
- Requires HTTPS in production (geolocation requires secure context)

## Future Enhancements

- Add ability to manually set location
- Display bird observations within the radius
- Add map controls (zoom, fullscreen)
- Cache location for better UX
- Add location accuracy indicator
