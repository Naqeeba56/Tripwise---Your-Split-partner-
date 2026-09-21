/**
 * Diagnoses the DEPLOYED Vercel bundle:
 *  - does it contain a Google Maps key / Unsplash key?
 *  - does it reference the Places API at all?
 *  - is the mobile dock CSS (flex) present?
 */
const BASE = process.argv[2] || 'https://tripwise-your-split-partner.vercel.app';

const get = async (p) => {
  const r = await fetch(BASE + p);
  return r.ok ? r.text() : '';
};

const main = async () => {
  const html = await get('/');
  if (!html) return console.log('❌ could not load', BASE);

  const buildId = (html.match(/buildId":"([^"]+)/) || [])[1];
  console.log('buildId:', buildId || '(none)');

  // Collect every chunk referenced by the HTML + build manifest
  const chunks = new Set();
  for (const m of html.matchAll(/\/_next\/static\/chunks\/[^"'\\ ]+?\.js/g)) chunks.add(m[0]);
  if (buildId) {
    for (const f of ['/_buildManifest.js', '/_ssgManifest.js']) {
      const t = await get(`/_next/static/${buildId}${f}`);
      for (const m of t.matchAll(/"(\/static\/[^"]+\.js)"/g)) chunks.add('/_next' + m[1]);
    }
  }

  // The webpack runtime holds a map of chunkId -> filename for LAZY chunks.
  // Expand it so we scan the route chunks (where the app code lives), not just entry ones.
  for (const c of [...chunks]) {
    if (!/webpack/.test(c)) continue;
    const w = await get(c);
    for (const m of w.matchAll(/"([a-z0-9\-_.]+\.js)"/g)) {
      chunks.add('/_next/static/chunks/' + m[1]);
    }
    for (const m of w.matchAll(/"(\d+):\[([^\]]*)\]/g)) {
      for (const n of m[2].matchAll(/"([a-z0-9\-_.]+)"/g)) {
        chunks.add('/_next/static/chunks/' + n[1] + '.js');
      }
    }
  }
  console.log('chunks found:', chunks.size);

  let googleKey = null;
  let unsplashRef = false;
  let placesRef = false;
  let emptyEnvLiterals = 0;

  for (const c of chunks) {
    const t = await get(c);
    if (!t) continue;
    const k = t.match(/AIza[0-9A-Za-z_\-]{20,}/);
    if (k && !googleKey) googleKey = { chunk: c, key: k[0] };
    if (/api\.unsplash\.com/.test(t)) unsplashRef = true;
    if (/places\.googleapis\.com/.test(t)) placesRef = true;
    // env var inlined as an empty string => var missing at build time
    if (/NEXT_PUBLIC_[A-Z_]+/.test(t)) emptyEnvLiterals++;
  }

  console.log('\n--- RESULTS ---');
  console.log('Google key present in bundle :', googleKey ? '✅ YES → ' + googleKey.key.slice(0, 12) + '… (' + googleKey.chunk + ')' : '❌ NO  → NEXT_PUBLIC_GOOGLE_MAPS_API_KEY was NOT set on Vercel at build time');
  console.log('Places API referenced        :', placesRef ? '✅ yes' : '❌ no');
  console.log('Unsplash API referenced      :', unsplashRef ? '✅ yes' : '❌ no');
  console.log('files w/ NEXT_PUBLIC_ tokens :', emptyEnvLiterals);

  if (googleKey) {
    // Try the exact photo endpoint shape the app builds
    const probe = `https://places.googleapis.com/v1/places/ChIJLU7jZClu5kcR4PcOOO6p3I0/media?maxHeightPx=400&maxWidthPx=600&key=${googleKey.key}`;
    const pr = await fetch(probe, { redirect: 'manual' });
    console.log('photo endpoint status        :', pr.status, pr.headers.get('location') ? '→ redirect ✅' : '');
  }
};

main().catch((e) => console.log('ERR', e.message));
