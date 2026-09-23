/**
 * POST /api/routes
 *
 * Server-side proxy for the Google Routes API v2 (computeRoutes).
 * Keeps `GOOGLE_MAPS_API_KEY` (server-only) out of the browser bundle.
 *
 * Body: {
 *   originLat, originLng, destLat, destLng, travelMode
 * }
 *
 * Returns: { distanceMeters, distanceKm, durationSeconds, durationText,
 *            distanceText, encodedPolyline, source } or { error, status }
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getKey = () =>
  process.env.GOOGLE_MAPS_API_KEY || '';

const MODE_MAP = {
  road:      'DRIVE',
  cab:       'DRIVE',
  selfdrive: 'DRIVE',
  bike:      'TWO_WHEELER',
  train:     'TRANSIT',
  bus:       'TRANSIT',
  flight:    'DRIVE',
};

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return 'N/A';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export async function POST(request) {
  const key = getKey();
  if (!key) {
    return Response.json(
      { error: 'GOOGLE_MAPS_API_KEY not configured' },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const originLat = parseFloat(body.originLat);
  const originLng = parseFloat(body.originLng);
  const destLat = parseFloat(body.destLat);
  const destLng = parseFloat(body.destLng);
  const travelMode = body.travelMode || 'road';
  const apiMode = MODE_MAP[travelMode] || 'DRIVE';

  if (![originLat, originLng, destLat, destLng].every(Number.isFinite)) {
    return Response.json(
      { error: 'Valid originLat, originLng, destLat, destLng are required' },
      { status: 400 }
    );
  }

  const payload = {
    origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
    destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
    travelMode: apiMode,
    computeAlternativeRoutes: false,
    languageCode: 'en-IN',
    units: 'METRIC',
  };

  if (apiMode === 'DRIVE') payload.routingPreference = 'TRAFFIC_AWARE';

  try {
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': [
          'routes.distanceMeters',
          'routes.duration',
          'routes.staticDuration',
          'routes.polyline.encodedPolyline',
        ].join(','),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json(
        { error: err?.error?.message || `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 502 });
    }

    const route = data.routes?.[0];
    if (!route) return Response.json({ error: 'No route returned' }, { status: 502 });

    const distanceMeters = route.distanceMeters || 0;
    const distanceKm = Math.round(distanceMeters / 1000);
    const durationRaw = route.duration || route.staticDuration || '0s';
    const durationSeconds = parseInt(durationRaw.replace('s', ''), 10) || 0;

    return Response.json({
      distanceMeters,
      distanceKm,
      durationSeconds,
      durationText: formatDuration(durationSeconds),
      distanceText: `${distanceKm} km`,
      encodedPolyline: route.polyline?.encodedPolyline || null,
      source: 'routes_api',
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}