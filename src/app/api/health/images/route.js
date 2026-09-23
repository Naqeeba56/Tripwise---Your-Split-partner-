/**
 * GET /api/health/images
 *
 * Deployment diagnostic: reports WHICH image keys the server can see, without
 * ever revealing their values. Open this on Vercel to confirm at a glance
 * whether the real-time image pipeline is configured.
 *
 *   {
 *     "googleMapsKey": "set" | "missing",
 *     "googleKeySource": "GOOGLE_MAPS_API_KEY" | null,
 *     "unsplashKey": "set" | "missing",
 *     "unsplashKeySource": "UNSPLASH_ACCESS_KEY" | null,
 *     "placesPhotoProxy": "ready" | "missing-key"
 *   }
 *
 * Both keys are SERVER-ONLY: they are read here and inside the /api/places/*,
 * /api/routes and /api/unsplash proxies — never in client code.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || '';
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || '';

  return Response.json(
    {
      googleMapsKey: googleKey ? 'set' : 'missing',
      googleKeySource: googleKey ? 'GOOGLE_MAPS_API_KEY (server-only ✓)' : null,
      unsplashKey: unsplashKey ? 'set' : 'missing',
      unsplashKeySource: unsplashKey ? 'UNSPLASH_ACCESS_KEY (server-only ✓)' : null,
      placesPhotoProxy: googleKey ? 'ready' : 'missing-key',
      routesProxy: googleKey ? 'ready' : 'missing-key',
      unsplashProxy: unsplashKey ? 'ready' : 'missing-key',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
