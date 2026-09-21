/**
 * GET /api/places/autocomplete?q=goa
 *
 * Server-side proxy for Places Autocomplete (New). Keeps the Google key off
 * the client and works even when no NEXT_PUBLIC_ key was present at build time.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getKey = () =>
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  '';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (q.length < 2) {
    return Response.json({ suggestions: [] });
  }

  const key = getKey();
  if (!key) {
    return Response.json(
      { suggestions: [], error: 'GOOGLE_MAPS_API_KEY not configured' },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': '*',
        },
        body: JSON.stringify({ input: q, languageCode: 'en' }),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json(
        { suggestions: [], error: err?.error?.message || `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json({ suggestions: data.suggestions || [] });
  } catch (err) {
    return Response.json({ suggestions: [], error: err.message }, { status: 502 });
  }
}
