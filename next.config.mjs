/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Bridge a couple of NON-secret, server-side variables to the client bundle.
  //
  // Why: `NEXT_PUBLIC_*` variables are inlined by Next.js, but we deliberately
  // dropped that prefix from the Supabase project URL and the app URL so the
  // naming no longer suggests "everything with a public prefix is safe to
  // publish". Both values are identifiers, not credentials:
  //   - SUPABASE_URL: the browser MUST talk to Supabase directly, and the anon
  //     key (public by design) already contains the project ref.
  //   - APP_URL:      fallback for OAuth redirect URLs.
  // Secrets (GOOGLE_MAPS_API_KEY, UNSPLASH_ACCESS_KEY, service keys) are NEVER
  // listed here — they stay server-only, read exclusively inside the API routes.
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    APP_URL: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '',
  },
};

export default nextConfig;
