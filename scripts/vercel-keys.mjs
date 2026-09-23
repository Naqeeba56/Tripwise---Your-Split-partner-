/**
 * Diagnose whether NEXT_PUBLIC_* keys were baked into the deployed Vercel bundle.
 * Run:  node scripts/vercel-keys.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'https://tripwise-your-split-partner.vercel.app';
const ROUTES = ['/', '/app', '/login'];

const get = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
};

const main = async () => {
  console.log(`\n=== Probing ${BASE} ===\n`);

  const html = await get(BASE);
  const resources = [html];

  // Probe each route so we also discover its lazy-loaded page chunk.
  for (const r of ROUTES) {
    try {
      const pageHtml = await get(BASE + r);
      resources.push(pageHtml);
      console.log(`Route ${r.padEnd(8)} -> ${pageHtml.length} bytes`);
    } catch (e) {
      console.log(`Route ${r.padEnd(8)} -> ${e.message}`);
    }
  }

  // 1. Collect every script chunk (entry + preloaded) across all routes.
  const chunks = [
    ...new Set(
      resources.flatMap((h) => [...h.matchAll(/\/_next\/static\/[^"'\\\s]+?\.js/g)].map((m) => m[0]))
    ),
  ];
  console.log(`Entry/preloaded chunks: ${chunks.length}`);

  // 2. Follow the webpack runtime to enumerate ALL lazy route chunks.
  const runtime = chunks.find((c) => /webpack|main-app|framework|app\//.test(c));
  let allChunks = [...chunks];
  for (const c of chunks) {
    try {
      const t = await get(BASE + c);
      const lazy = [...t.matchAll(/static\/chunks\/[^"'\\\s]+?\.js/g)].map((m) => '/_next/' + m[0]);
      allChunks.push(...lazy);
    } catch { /* ignore */ }
  }
  allChunks = [...new Set(allChunks)];
  console.log(`Total chunks discovered: ${allChunks.length}\n`);

  // 3. Download and scan.
  let googleKey = null;
  let unsplashKey = null;
  let supabase = false;
  let placesRef = 0;

  for (const c of allChunks) {
    let t = '';
    try { t = await get(BASE + c); } catch { continue; }
    if (t.includes('places.googleapis.com')) placesRef++;
    if (t.includes('supabase.co')) supabase = true;
    const g = t.match(/AIza[0-9A-Za-z_-]{35}/);
    if (g && !googleKey) googleKey = { chunk: c, key: g[0] };
    const u = t.match(/Client-ID[^"]{0,4}/) || t.match(/[0-9A-Za-z_-]{43}/g)?.find((x) => x.length === 43 && t.includes('unsplash'));
    if (u && !unsplashKey) unsplashKey = c;
  }

  console.log('── RESULTS ─────────────────────────────────');
  console.log('supabase.co string present        :', supabase);
  console.log('chunks referencing places.googleapis:', placesRef);
  console.log('Google Maps key leaked to bundle  :', googleKey ? `❌ YES (${googleKey.chunk})` : '✅ NO (server-only)');
  console.log('Unsplash key leaked to bundle     :', unsplashKey ? `❌ YES (${unsplashKey})` : '✅ NO (server-only)');

  if (googleKey) {
    console.log('\n>>> The Google Maps key is INLINED INTO THE BROWSER BUNDLE.');
    console.log('>>> Remove NEXT_PUBLIC_GOOGLE_MAPS_API_KEY from Vercel and use GOOGLE_MAPS_API_KEY instead, then REDEPLOY.');
  } else {
    console.log('\n>>> Keys are not shipped to the browser. ✅');
    console.log('>>> Confirm the server can still see them: GET /api/health/images');
  }

  // 4. Also confirm the app actually renders (not a build error page).
  console.log('\nApp title present:', /<title[^>]*>([^<]*)<\/title>/.exec(html)?.[1] || '(none)');
};

main().catch((e) => {
  console.error('Diag failed:', e.message);
  process.exit(1);
});
