/**
 * GET /api/places/details?id=ChIJ...&fields=id,displayName,photos
 *
 * Server-side proxy for Places Details (New).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getKey = () =>
  process.env.GOOGLE_MAPS_API_KEY ||
  '';

const DEFAULT_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'photos',
  'rating',
  'userRatingCount',
  'editorialSummary',
  'types',
  'googleMapsUri',
  'websiteUri',
].join(',');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Missing "id" parameter' }, { status: 400 });
  }

  const key = getKey();
  if (!key) {
    return Response.json(
      { error: 'GOOGLE_MAPS_API_KEY not configured' },
      { status: 503 }
    );
  }

  const fields = searchParams.get('fields') || DEFAULT_FIELDS;
  const placeId = id.startsWith('places/') ? id : `places/${id}`;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': fields,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json(
        { error: err?.error?.message || `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    return Response.json(await res.json());
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
