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
 *     rebuild gymnastics.
 *
 * HOW IT WORKS (robust across environments — INCLUDING Vercel)
 * ------------------------------------------------------------
 * 1. Auth: `X-Goog-Api-Key` header (the same auth the working details /
 *    autocomplete routes use). The key stays server-side, applied inside this
 *    function — never in the browser bundle, never in the URL.
 *
 * 2. Redirect, not bytes: getMedia WITHOUT `skipHttpRedirect` returns a 302
 *    whose `Location` is a short-lived SIGNED lh3.googleusercontent.com URL.
 *    We hand that redirect straight back to the browser, which then downloads
 *    the image DIRECTLY from Google's CDN.
 *
 * Why THIS is the reliable shape:
 *    • No Vercel serverless-function response-size limit. Streaming large JPEG
 *      bytes through the function hits Vercel's ~4.5MB body cap in production
 *      (which is why photos worked on localhost but broke on Vercel). With a
 *      redirect, the heavy download never touches our function.
 *    • Fast + cacheable: the browser fetches from Google's edge CDN, and our
 *      proxy response carries a long Cache-Control so repeat loads are cheap.
 *    • No expiring redirect to cache ourselves — the signed `photoUri` changes
 *      per request, so the only correct thing to do is to forward each fresh
 *      one to the browser.
 *    • The key is added server-side inside this function, never sent to the
 *      browser, and never exposed to hosting-layer URL rewriting.
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
      'Google Maps API key is not configured on the server. Set GOOGLE_MAPS_API_KEY.',
      { status: 503 }
    );
  }

  const width = clamp(searchParams.get('w'), 1200, 3200);
  const height = clamp(searchParams.get('h'), 800, 3200);

  const photoName = name.startsWith('places/') ? name : `places/${name}`;

  // getMedia WITHOUT `skipHttpRedirect`: Google responds 302 and returns the
  // signed `Location` (lh3.googleusercontent.com) URL. We hand that redirect to
  // the browser so the image bytes are downloaded DIRECTLY from Google's CDN.
  //
  // WHY NOT stream the bytes here (old design)?
  //   Streaming the JPEG through this serverless function hits Vercel's
  //   ~4.5MB response-body limit on large photos -> truncated/broken images
  //   in production, while localhost (no limit) worked fine. The redirect model
  //   moves the heavy download off our function entirely, so it is equally fast
  //   and reliable on localhost and Vercel.
  //
  // WHY NOT use the `key=` query param? It is acceptable, but the header
  // (`X-Goog-Api-Key`) is the same auth the working details/autocomplete routes
  // use, and keeps the key out of URL rewriting layers on the host.
  const mediaUrl =
    `https://places.googleapis.com/v1/${photoName}/media` +
    `?maxHeightPx=${height}&maxWidthPx=${width}`;

  try {
    const upstream = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': key,
      },
      // Do NOT follow the 302 ourselves — read it and give it to the browser.
      redirect: 'manual',
      cache: 'no-store',
    });

    // Preferred path: Google 302-redirects to a signed lh3 URL. Return that to
    // the browser as a 302 so the image loads from Google's CDN (edge-cacheable,
    // no Vercel function size limit, no expiring-content caching on our side).
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('location');
      if (location) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: location,
            'Cache-Control':
              'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          },
        });
      }
    }

    // Fallback: if Google returned the raw bytes (200) for any reason, stream
    // them through as a last resort.
    if (upstream.ok) {
      const body = await upstream.arrayBuffer();
      const contentType =
        upstream.headers.get('content-type') || 'image/jpeg';
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(body.byteLength),
          'Cache-Control':
            'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        },
      });
    }

    return new Response(`Photo unavailable (upstream ${upstream.status})`, {
      status: 404,
    });
  } catch (err) {
    return new Response(`Upstream error: ${err.message}`, { status: 502 });
  }
}
