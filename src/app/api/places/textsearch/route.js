/**
 * GET /api/places/textsearch?q=hotels+in+goa&lat=15.2&lng=74&max=8
 *
 * Server-side proxy for Places Text Search (New). Optional lat/lng add a
 * 30 km circular location bias.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getKey = () =>
  process.env.GOOGLE_MAPS_API_KEY ||
  '';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.photos',
  'places.rating',
  'places.userRatingCount',
  'places.editorialSummary',
  'places.types',
  'places.googleMapsUri',
  'places.websiteUri',
  'places.priceLevel',
].join(',');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return Response.json({ places: [] });
  }

  const key = getKey();
  if (!key) {
    return Response.json(
      { places: [], error: 'GOOGLE_MAPS_API_KEY not configured' },
      { status: 503 }
    );
  }

  const max = Math.min(parseInt(searchParams.get('max') || '10', 10) || 10, 20);
  const lat = parseFloat(searchParams.get('lat'));
  const lng = parseFloat(searchParams.get('lng'));
  const radius = parseInt(searchParams.get('radius') || '30000', 10) || 30000;

  const body = { textQuery: q, maxResultCount: max, languageCode: 'en' };

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    body.locationBias = {
      circle: { center: { latitude: lat, longitude: lng }, radius },
    };
  }

  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
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
