/**
 * GET /api/places/photo?name=places/<id>/photos/<photo>&w=1200&h=800
 *
 * Server-side proxy for Google Places (New) photo media.
 *
 * WHY THIS EXISTS
 * ---------------
 * The browser-side flow required `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to be
 * inlined at BUILD time. If that variable is missing on the host (Vercel),
 * the deployed bundle has no key at all and every photo silently fails.
 *
 * Reading the key here (at request time, server side) means:
 *   • the key never ships to the browser (better security), and
 *   • a plain `GOOGLE_MAPS_API_KEY` env var on the host is enough — no
 *     NEXT_PUBLIC_ rebuild gymnastics.
 *
 * We stream the bytes back instead of 302-redirecting so the key is never
 * exposed and the response is edge-cacheable.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getKey = () =>
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  '';

const clamp = (raw, fallback, max) => {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return new Response('Missing "name" query parameter', { status: 400 });
  }

  const key = getKey();
  if (!key) {
    return new Response(
      'Google Maps API key is not configured on the server. Set GOOGLE_MAPS_API_KEY (or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).',
      { status: 503 }
    );
  }

  const width = clamp(searchParams.get('w'), 1200, 4800);
  const height = clamp(searchParams.get('h'), 800, 4800);

  const photoName = name.startsWith('places/') ? name : `places/${name}`;
  const mediaUrl =
    `https://places.googleapis.com/v1/${photoName}/media` +
    `?maxHeightPx=${height}&maxWidthPx=${width}&key=${key}`;

  try {
    const upstream = await fetch(mediaUrl, {
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return new Response(`Photo unavailable (upstream ${upstream.status})`, {
        status: 404,
      });
    }

    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/jpeg',
        'Content-Length': String(body.byteLength),
        // Cache hard: place photos are effectively immutable.
        'Cache-Control':
          'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    return new Response(`Upstream error: ${err.message}`, { status: 502 });
  }
}
