/**
 * Tripwise Routes API Service
 * ────────────────────────────────────────────────────────────────
 * Routes API v2 (computeRoutes) — CONFIRMED LIVE with current key.
 * Mumbai→Lonavala: 83,606m / 1h 46m (verified Sept 2026).
 *
 * Falls back to offline distance table (fareEngine.getDistanceKm)
 * only when the API call fails (network error or quota exceeded).
 */

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const ROUTES_URL     = 'https://routes.googleapis.com/directions/v2:computeRoutes';

// Routes API travel-mode map
const MODE_MAP = {
  road:      'DRIVE',
  cab:       'DRIVE',
  selfdrive: 'DRIVE',
  bike:      'TWO_WHEELER',   // Routes API supports TWO_WHEELER in India
  train:     'TRANSIT',
  bus:       'TRANSIT',
  flight:    'DRIVE',         // Proxy: road distance as lower bound for flight km
};

// ─── Core: computeRoutes ─────────────────────────────────────────────────────

export const computeRoute = async ({ originLat, originLng, destLat, destLng, travelMode = 'road' }) => {
  const apiMode = MODE_MAP[travelMode] || 'DRIVE';

  try {
    const body = {
      origin:      { location: { latLng: { latitude: originLat,  longitude: originLng } } },
      destination: { location: { latLng: { latitude: destLat,    longitude: destLng   } } },
      travelMode: apiMode,
      computeAlternativeRoutes: false,
      languageCode: 'en-IN',
      units: 'METRIC',
    };

    // Routing preference only supported for DRIVE
    if (apiMode === 'DRIVE') body.routingPreference = 'TRAFFIC_AWARE';

    const res = await fetch(ROUTES_URL, {
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': [
          'routes.distanceMeters',
          'routes.duration',
          'routes.staticDuration',
          'routes.polyline.encodedPolyline',
        ].join(','),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[Routes API]', err?.error?.message || `HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.error) { console.warn('[Routes API]', data.error.message); return null; }

    const route = data.routes?.[0];
    if (!route) return null;

    const distanceMeters  = route.distanceMeters || 0;
    const distanceKm      = Math.round(distanceMeters / 1000);
    const durationRaw     = route.duration || route.staticDuration || '0s';
    const durationSeconds = parseInt(durationRaw.replace('s', ''), 10) || 0;

    return {
      distanceMeters,
      distanceKm,
      durationSeconds,
      durationText:    formatDuration(durationSeconds),
      distanceText:    `${distanceKm} km`,
      encodedPolyline: route.polyline?.encodedPolyline || null,
      source:          'routes_api',
    };
  } catch (err) {
    console.warn('[Routes API] network error:', err.message);
    return null;
  }
};

// ─── calculateRouteCost ───────────────────────────────────────────────────────
// Derives transport cost breakdown from real route distance + mode.

export const calculateRouteCost = ({ distanceKm = 0, durationSeconds = 0, travelMode = 'road', travelers = 2, days = 2, travelStyle = 'balanced' }) => {
  const d    = Math.max(1, distanceKm);
  const numT = Math.max(1, travelers);
  const numD = Math.max(1, days);
  const r50  = (n) => Math.round(n / 50) * 50;

  let totalTransportCost = 0;
  let breakdown = {};
  let note = '';

  switch (travelMode) {
    case 'selfdrive': {
      const fuel   = r50((d * 2 / 15) * 105);
      const toll   = Math.round(d * 2 * 0.6 * 1.65 * 0.85); // 60% highway, FASTag
      const rental = (travelStyle === 'luxury' ? 4500 : 2500) * numD;
      totalTransportCost = fuel + toll + rental;
      breakdown = { fuel, tolls: toll, rental };
      note = `${d} km drive · ~${Math.round(d * 2 / 15)} L petrol round-trip`;
      break;
    }
    case 'road':
    case 'cab': {
      const rate   = travelStyle === 'luxury' ? 18 : travelStyle === 'budget' ? 8 : 12;
      const intercity = Math.max(1200, d * rate) * 2;
      const local  = numT * 350 * numD;
      totalTransportCost = intercity + local;
      breakdown = { intercity, localCommute: local };
      note = `${d} km · ₹${rate}/km`;
      break;
    }
    case 'train': {
      const rate  = travelStyle === 'luxury' ? 2.5 : travelStyle === 'budget' ? 0.6 : 1.2;
      const fare  = Math.max(300, Math.round(d * rate));
      const train = fare * 2 * numT;
      const local = numT * 350 * numD;
      totalTransportCost = train + local;
      breakdown = { trainTickets: train, localCommute: local, perPersonOneWay: fare };
      note = `${d} km · ₹${rate}/km/person`;
      break;
    }
    case 'bus': {
      const fare  = Math.max(120, Math.round(d * 1.6));
      const bus   = fare * 2 * numT;
      const local = numT * 200 * numD;
      totalTransportCost = bus + local;
      breakdown = { busTickets: bus, localCommute: local, perPersonOneWay: fare };
      note = `${d} km · approx Volvo rate`;
      break;
    }
    case 'flight': {
      const base  = travelStyle === 'luxury' ? 8500 : travelStyle === 'budget' ? 3200 : 5000;
      const surge = d > 1500 ? 2000 : d > 800 ? 1000 : 0;
      const fares = (base + surge) * 2 * numT;
      const xfer  = numT * 800 * 2;
      const local = numT * 500 * numD;
      totalTransportCost = fares + xfer + local;
      breakdown = { flightTickets: fares, airportTransfer: xfer, localCommute: local };
      note = `~${d} km air · ₹${base + surge} one-way est.`;
      break;
    }
    case 'bike': {
      const fuel  = r50((d * 2 / 45) * 105);
      const bikes = Math.ceil(numT / 2);
      totalTransportCost = fuel * bikes;
      breakdown = { fuel, bikesNeeded: bikes };
      note = `${d} km · ${bikes} bike(s) · ~${Math.round(d * 2 / 45)} L petrol`;
      break;
    }
    default:
      totalTransportCost = numT * 1200;
      breakdown = { misc: totalTransportCost };
      note = 'Generic estimate';
  }

  return {
    totalTransportCost: Math.round(totalTransportCost),
    breakdown,
    note,
    distanceKm: d,
    durationText: formatDuration(durationSeconds),
  };
};

// ─── helpers ─────────────────────────────────────────────────────────────────

export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return 'N/A';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function decodePolyline(encoded) {
  if (!encoded) return [];
  const pts = [];
  let idx = 0, lat = 0, lng = 0;
  while (idx < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    pts.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return pts;
}
