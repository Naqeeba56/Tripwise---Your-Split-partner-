/**
 * Tripwise Unsplash Image Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses the Unsplash API (free, 50 req/hr) to fetch real destination photos.
 *
 * Setup:
 *   1. Go to https://unsplash.com/developers
 *   2. Create a new application (free)
 *   3. Copy your "Access Key"
 *   4. Add to .env.local:  NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_key_here
 *
 * If the key is missing, all functions return null/[] gracefully so the app
 * falls back to curated images.unsplash.com photo IDs without crashing.
 */

const UNSPLASH_KEY  = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';
const UNSPLASH_BASE = 'https://api.unsplash.com';

// ── helpers ──────────────────────────────────────────────────────────────────

const isConfigured = () => Boolean(UNSPLASH_KEY && UNSPLASH_KEY.length > 10);

/**
 * Build a search query that works well for Indian destinations.
 * Adds "India travel" context to avoid unrelated results.
 */
const buildQuery = (term, context = 'travel tourism') =>
  `${term.trim()} India ${context}`;

// ── 1. Search photos by keyword ───────────────────────────────────────────────

/**
 * Returns an array of Unsplash photo objects.
 * Each object has: { id, url, thumbUrl, smallUrl, altDescription, credit }
 *
 * url      → full-size (use for hero banners)
 * smallUrl → ~400px wide (use for cards, gem images, hotel thumbnails)
 * thumbUrl → ~200px (use for tiny previews)
 */
export const searchPhotos = async (query, count = 5, orientation = 'landscape') => {
  if (!isConfigured()) return [];

  try {
    const params = new URLSearchParams({
      query: buildQuery(query),
      per_page: count,
      orientation,
      content_filter: 'high',
      order_by: 'relevant',
    });

    const res = await fetch(`${UNSPLASH_BASE}/search/photos?${params}`, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!res.ok) {
      console.warn('[Unsplash] Search failed:', res.status, res.statusText);
      return [];
    }

    const data = await res.json();

    return (data.results || []).map((photo) => ({
      id:              photo.id,
      url:             photo.urls?.regular || photo.urls?.full,   // ~1080px wide
      smallUrl:        photo.urls?.small,                          // ~400px wide
      thumbUrl:        photo.urls?.thumb,                          // ~200px wide
      rawUrl:          photo.urls?.raw,                            // full res
      altDescription:  photo.alt_description || query,
      credit:          photo.user?.name || 'Unsplash',
      creditLink:      photo.user?.links?.html,
      downloadUrl:     photo.links?.download_location,             // for attribution trigger
    }));
  } catch (err) {
    console.warn('[Unsplash] Network error:', err.message);
    return [];
  }
};

// ── 2. Get destination cover image ────────────────────────────────────────────

/**
 * Returns a single high-quality landscape photo URL for a destination.
 * Tries multiple query variants if first search returns nothing.
 */
export const getDestinationPhoto = async (destinationName) => {
  if (!isConfigured() || !destinationName) return null;

  // Try specific query first, then broader
  const queries = [
    destinationName,
    `${destinationName} city`,
    `${destinationName} landmark`,
  ];

  for (const q of queries) {
    const photos = await searchPhotos(q, 3, 'landscape');
    if (photos.length > 0) return photos[0].url;
  }

  return null;
};

// ── 3. Get photos for a place / hidden gem ────────────────────────────────────

/**
 * Returns up to `count` real photos for a named place.
 * Used for hidden gem cards, attraction cards, and hotel thumbnails.
 */
export const getPlacePhotos = async (placeName, destinationContext = '', count = 3) => {
  if (!isConfigured()) return [];

  const query = destinationContext
    ? `${placeName} ${destinationContext}`
    : placeName;

  const photos = await searchPhotos(query, count, 'landscape');
  if (photos.length > 0) return photos;

  // Fallback: search just the place name
  return searchPhotos(placeName, count, 'landscape');
};

// ── 4. Batch: get photos for multiple gems at once ────────────────────────────

/**
 * Takes an array of gem names and returns a map: { gemName: photoUrl | null }
 * Runs sequentially with 50ms delays to respect rate limits.
 */
export const batchGetGemPhotos = async (gemNames, destinationName = '') => {
  if (!isConfigured() || !gemNames?.length) return {};

  const results = {};
  for (const name of gemNames) {
    const photos = await getPlacePhotos(name, destinationName, 1);
    results[name] = photos[0]?.url || photos[0]?.smallUrl || null;
    // Small delay to avoid hammering the API
    await new Promise((r) => setTimeout(r, 60));
  }
  return results;
};

// ── 5. Trigger attribution (required by Unsplash guidelines) ──────────────────

/**
 * Must be called when a photo is downloaded/displayed in full.
 * This is a Unsplash API requirement — failing to do this can revoke API access.
 * Call it lazily (fire-and-forget) when the image is shown.
 */
export const triggerAttribution = async (downloadUrl) => {
  if (!isConfigured() || !downloadUrl) return;
  try {
    await fetch(downloadUrl, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    });
  } catch {
    // Non-critical — ignore errors
  }
};

// ── 6. Utility: is the Unsplash API key configured? ──────────────────────────

export const isUnsplashConfigured = isConfigured;
