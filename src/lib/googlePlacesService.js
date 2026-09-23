/**
 * Tripwise Google Places API (New) — Service Layer
 * ─────────────────────────────────────────────────
 * SECURITY: This module is CLIENT-SIDE but NEVER contains, reads, or embeds
 * the Google API key. Every request is proxied through a server-side route
 * (/api/places/*) that holds `GOOGLE_MAPS_API_KEY` secretly on the server.
 *
 * Keeping the key server-side means it is never inlined into the browser
 * bundle, so `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is no longer required (or
 * exposed) at build time.
 *
 * All function signatures below are unchanged from the previous version so
 * existing callers (BudgetEstimator, page.js, …) keep working.
 */

// ─── helpers ─────────────────────────────────────────────────────────────────

const proxyGet = async (path, params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`/api/places/${path}${suffix}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
};

// ─── 1. Autocomplete — NO type filter so ANY place works ─────────────────────
// Works for: cities, waterfalls, temples, national parks, beaches, etc.

export const fetchPlaceAutocomplete = async (inputQuery) => {
  if (!inputQuery || inputQuery.trim().length < 2) return [];
  try {
    const data = await proxyGet('autocomplete', { q: inputQuery });
    return data.suggestions || [];
  } catch (err) {
    console.warn('[Places Autocomplete]', err.message);
    return [];
  }
};

// ─── 2. Place Details — coordinates + photos + summary ───────────────────────

export const fetchPlaceDetails = async (placeId) => {
  if (!placeId) return null;
  try {
    return await proxyGet('details', { id: placeId });
  } catch (err) {
    console.warn('[Place Details]', err.message);
    return null;
  }
};

// ─── 3. Photo URL — server proxy keeps the key secret ────────────────────────
// The /api/places/photo route streams the image bytes with the key applied
// server-side, so the browser just uses a key-less relative URL. This works
// directly in <img src>, is edge-cacheable, and never exposes the key.

export const getPlacePhotoUrl = (photoName, maxH = 800, maxW = 1200) => {
  if (!photoName) return null;
  const name = photoName.startsWith('places/') ? photoName : `places/${photoName}`;
  return `/api/places/photo?name=${encodeURIComponent(name)}&w=${maxW}&h=${maxH}`;
};

export const resolvePhotoUrl = async (photoName, maxH = 800, maxW = 1200) => {
  // The proxy URL is stable and key-less — treat it as the resolved URL.
  return getPlacePhotoUrl(photoName, maxH, maxW);
};
// ─── 4. Text Search — any free-text query ────────────────────────────────────

export const fetchTextSearch = async (textQuery, locationBias = null, maxResults = 10) => {
  try {
    let lat, lng, radius;
    if (locationBias?.circle?.center) {
      lat = locationBias.circle.center.latitude;
      lng = locationBias.circle.center.longitude;
      radius = locationBias.circle.radius;
    }
    const data = await proxyGet('textsearch', {
      q: textQuery,
      lat,
      lng,
      radius,
      max: maxResults,
    });
    return data.places || [];
  } catch (err) {
    console.warn('[Text Search]', err.message);
    return [];
  }
};

// ─── 5. Nearby Search ────────────────────────────────────────────────────────

export const fetchNearbyPlaces = async (lat, lng, radiusMeters = 10000, includedTypes = []) => {
  try {
    const data = await proxyGet('nearby', {
      lat,
      lng,
      radius: radiusMeters,
      types: includedTypes.length ? includedTypes.join(',') : undefined,
    });
    return data.places || [];
  } catch (err) {
    console.warn('[Nearby Search]', err.message);
    return [];
  }
};
// ─── 6. Geocode a place name → { placeId, lat, lng, name, address, photos, summary } ──

export const geocodePlace = async (query) => {
  if (!query || query.trim().length < 2) return null;
  try {
    // Use autocomplete to get placeId, then details for coords
    const suggs = await fetchPlaceAutocomplete(query);
    if (!suggs.length) return null;

    const placeId = suggs[0]?.placePrediction?.placeId
      || suggs[0]?.placePrediction?.place?.split('/').pop();
    if (!placeId) return null;

    const details = await fetchPlaceDetails(placeId);
    if (!details?.location) return null;

    return {
      placeId,
      lat:     details.location.latitude,
      lng:     details.location.longitude,
      name:    details.displayName?.text || query,
      address: details.formattedAddress || '',
      photos:  details.photos || [],
      summary: details.editorialSummary?.text || '',
      rating:  details.rating,
      mapsUri: details.googleMapsUri,
    };
  } catch (err) {
    console.warn('[Geocode]', err.message);
    return null;
  }
};

// ─── 7. Hidden gems search for any destination ───────────────────────────────
// Runs two parallel Text Searches: offbeat spots + scenic viewpoints.

export const fetchHiddenGems = async (destinationName, lat, lng) => {
  const bias = lat && lng ? {
    circle: { center: { latitude: lat, longitude: lng }, radius: 30000 },
  } : null;

  const [offbeat, scenic] = await Promise.all([
    fetchTextSearch(`offbeat hidden gems places to visit near ${destinationName}`, bias, 6),
    fetchTextSearch(`scenic viewpoints nature waterfalls ${destinationName}`, bias, 6),
  ]);

  // Merge + de-dupe by id
  const seen = new Set();
  return [...offbeat, ...scenic].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).slice(0, 8);
};

// ─── 8. Hotels near destination ──────────────────────────────────────────────

export const fetchHotelsNearDestination = async (destinationName, lat, lng) => {
  const bias = lat && lng ? {
    circle: { center: { latitude: lat, longitude: lng }, radius: 15000 },
  } : null;
  return fetchTextSearch(`hotels resorts homestays in ${destinationName}`, bias, 8);
};

// ─── 9. Resolve first photo of a place to a usable image URL ─────────────────

export const getFirstPhotoUrl = async (place, maxH = 600, maxW = 900) => {
  const photoName = place?.photos?.[0]?.name;
  if (!photoName) return null;
  return resolvePhotoUrl(photoName, maxH, maxW);
};