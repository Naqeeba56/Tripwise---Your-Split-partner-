/**
 * GET /api/health/images
 *
 * Deployment diagnostic: reports WHICH image keys the server can see, without
 * ever revealing their values. Open this on Vercel to confirm at a glance
 * whether the real-time image pipeline is configured.
 *
 *   {
 *     "googleMapsKey": "set" | "missing",
 *     "googleKeySource": "GOOGLE_MAPS_API_KEY" | "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" | null,
 *     "unsplashKey": "set" | "missing",
 *     "unsplashKeySource": "...",
 *     "placesPhotoProxy": "ready" | "missing-key"
 *   }
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const serverGoogle = process.env.GOOGLE_MAPS_API_KEY || '';
  const publicGoogle = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const googleKey = serverGoogle || publicGoogle;

  const serverUnsplash = process.env.UNSPLASH_ACCESS_KEY || '';
  const publicUnsplash = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';
  const unsplashKey = serverUnsplash || publicUnsplash;

  return Response.json(
    {
      googleMapsKey: googleKey ? 'set' : 'missing',
      googleKeySource: serverGoogle
        ? 'GOOGLE_MAPS_API_KEY'
        : publicGoogle
          ? 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
          : null,
      googleKeyLength: googleKey.length,
      unsplashKey: unsplashKey ? 'set' : 'missing',
      unsplashKeySource: serverUnsplash
        ? 'UNSPLASH_ACCESS_KEY'
        : publicUnsplash
          ? 'NEXT_PUBLIC_UNSPLASH_ACCESS_KEY'
          : null,
      placesPhotoProxy: googleKey ? 'ready' : 'missing-key',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
