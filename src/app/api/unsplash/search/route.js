/**
 * GET /api/unsplash/search?q=goa&count=5&orientation=landscape
 *
 * Server-side proxy for the Unsplash Search API.
 *
 * Reads the server-only `UNSPLASH_ACCESS_KEY` at request time, so the key is
 * never inlined into the browser bundle and no rebuild is needed on the host.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getKey = () =>
  process.env.UNSPLASH_ACCESS_KEY ||
  '';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return Response.json({ photos: [] });
  }

  const key = getKey();
  if (!key || key.length < 10) {
    return Response.json(
      { photos: [], error: 'UNSPLASH_ACCESS_KEY not configured' },
      { status: 503 }
    );
  }

  const count = Math.min(parseInt(searchParams.get('count') || '5', 10) || 5, 30);
  const orientation = searchParams.get('orientation') || 'landscape';

  const params = new URLSearchParams({
    query: q,
    per_page: String(count),
    orientation,
    content_filter: 'high',
    order_by: 'relevant',
  });

  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: {
        Authorization: `Client-ID ${key}`,
        'Accept-Version': 'v1',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return Response.json(
        { photos: [], error: `Unsplash HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    const photos = (data.results || []).map((photo) => ({
      id: photo.id,
      url: photo.urls?.regular || photo.urls?.full,
      smallUrl: photo.urls?.small,
      thumbUrl: photo.urls?.thumb,
      rawUrl: photo.urls?.raw,
      altDescription: photo.alt_description || q,
      credit: photo.user?.name || 'Unsplash',
      creditLink: photo.user?.links?.html,
      downloadUrl: photo.links?.download_location,
    }));

    return Response.json({ photos });
  } catch (err) {
    return Response.json({ photos: [], error: err.message }, { status: 502 });
  }
}
