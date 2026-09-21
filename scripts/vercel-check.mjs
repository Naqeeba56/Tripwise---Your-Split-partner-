/* Temporary diagnostic: what env values actually ship in the Vercel bundle? */
const BASE = 'https://tripwise-your-split-partner.vercel.app';

const get = async (url, opts) => {
  const r = await fetch(url, opts);
  return { status: r.status, text: await r.text() };
};

/** Enumerate every chunk the webpack runtime knows about. */
const allChunks = async (html) => {
  const scripts = [
    ...new Set([...html.matchAll(/\/_next\/static\/[^"']+?\.js/g)].map((m) => m[0])),
  ];
  const found = new Set(scripts);
  for (const s of scripts) {
    const t = (await get(`${BASE}${s}`)).text;
    // webpack maps: {123:"abc",456:"def"} or static/chunks/<name>-<hash>.js refs
    for (const m of t.matchAll(/"([a-zA-Z0-9_\-]{1,20})":"([a-f0-9]{16})"/g)) {
      found.add(`/_next/static/chunks/${m[1]}-${m[2]}.js`);
    }
    for (const m of t.matchAll(/static\/chunks\/[a-zA-Z0-9_\-\/\.]+\.js/g)) {
      found.add(`/_next/${m[0]}`);
    }
  }
  return [...found];
};

const run = async () => {
  const page = await get(`${BASE}/app`);
  console.log('GET /app ->', page.status, `(${page.text.length} bytes)`);

  const chunks = await allChunks(page.text);
  console.log('chunks discovered:', chunks.length);

  const secrets = { google: null, unsplash: null, supabase: null };
  let ok = 0;
  for (const c of chunks) {
    const r = await get(`${BASE}${c}`);
    if (r.status !== 200) continue;
    ok++;
    const t = r.text;
    if (!secrets.google) {
      const m = t.match(/AIzaSy[A-Za-z0-9_\-]{20,}/);
      if (m) secrets.google = { chunk: c, value: m[0] };
    }
    if (!secrets.unsplash) {
      const m = t.match(/Client-ID |UNSPLASH_ACCESS_KEY/);
      if (m) secrets.unsplash = { chunk: c };
    }
    if (!secrets.supabase) {
      const m = t.match(/https:\/\/[a-z0-9]{15,}\.supabase\.co/);
      if (m) secrets.supabase = { chunk: c, value: m[0] };
    }
  }

  console.log(`chunks fetched OK: ${ok}`);
  for (const [k, v] of Object.entries(secrets)) {
    console.log(`  ${k}:`, v ? JSON.stringify(v).slice(0, 170) : 'NOT FOUND');
  }

  // If a Google key exists, test it live against Places API (New)
  if (secrets.google) {
    const key = secrets.google.value;
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.photos',
      },
      body: JSON.stringify({ textQuery: 'Lonavala', maxResultCount: 1 }),
    });
    console.log('  live Places searchText ->', res.status);
    const body = await res.text();
    if (!res.ok) console.log('   body:', body.slice(0, 300));
    else console.log('   sample:', body.slice(0, 200));
  }
};

run().catch((e) => console.log('ERR', e.message));
