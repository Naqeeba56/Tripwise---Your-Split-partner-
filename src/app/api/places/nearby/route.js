/**
 * GET /api/places/nearby?lat=15.2&lng=74&radius=10000&types=tourist_attraction,park
 *
 * Server-side proxy for Places Nearby Search (New).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getKey = () =>
  process.env.GOOGLE_MAPS_API_KEY || '';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.photos',
  'places.googleMapsUri',
  'places.editorialSummary',
].join(',');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat'));
  const lng = parseFloat(searchParams.get('lng'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json(
      { places: [], error: 'Valid "lat" and "lng" are required' },
      { status: 400 }
    );
  }

  const key = getKey();
  if (!key) {
    return Response.json(
      { places: [], error: 'GOOGLE_MAPS_API_KEY not configured' },
      { status: 503 }
    );
  }

  const radius = parseInt(searchParams.get('radius') || '10000', 10) || 10000;
  const typesParam = searchParams.get('types');
  const includedTypes = typesParam
    ? typesParam.split(',').map((t) => t.trim()).filter(Boolean)
    : ['tourist_attraction', 'historical_landmark', 'museum', 'park'];

  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify({
          includedTypes,
          maxResultCount: 12,
          locationRestriction: {
            circle: { center: { latitude: lat, longitude: lng }, radius },
          },
          rankPreference: 'POPULARITY',
        }),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json(
        { places: [], error: err?.error?.message || `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json({ places: data.places || [] });
  } catch (err) {
    return Response.json({ places: [], error: err.message }, { status: 502 });
  }
}
