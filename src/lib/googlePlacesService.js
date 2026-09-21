/**
 * Tripwise Google Places API (New) — Service Layer
 * ─────────────────────────────────────────────────
 * All APIs confirmed LIVE with current key (tested Sept 2026):
 *   ✅ Places Autocomplete (New)
 *   ✅ Places Text Search (New)
 *   ✅ Place Details (New)
 *   ✅ Place Photos  → skipHttpRedirect=true gives stable lh3.googleusercontent.com URLs
 *   ✅ Routes API    (in routesService.js)
 *   ❌ Maps JS API   (needs enabling in Cloud Console)
 *   ❌ Maps Static   (needs enabling in Cloud Console)
 */

const GOOGLE_API_KEY  = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const PLACES_BASE     = 'https://places.googleapis.com/v1/places';

// ─── helpers ─────────────────────────────────────────────────────────────────

const placesPost = async (endpoint, body, fieldMask) => {
  const res = await fetch(`${PLACES_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type':   'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
};

const placesGet = async (path, fieldMask) => {
  const res = await fetch(`${PLACES_BASE}/${path}`, {
    method: 'GET',
    headers: {
      'Content-Type':   'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': fieldMask,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
};

// ─── 1. Autocomplete — NO type filter so ANY place works ─────────────────────
// Works for: cities, waterfalls, temples, national parks, beaches, etc.

export const fetchPlaceAutocomplete = async (inputQuery) => {
  if (!inputQuery || inputQuery.trim().length < 2) return [];
  try {
    const data = await placesPost(':autocomplete', {
      input: inputQuery,
      // No includedPrimaryTypes — so "Kalu Waterfall", "Lonavala", "Taj Mahal" all work
      languageCode: 'en',
    }, '*');
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
    return await placesGet(placeId, [
      'id', 'displayName', 'formattedAddress', 'location',
      'photos', 'rating', 'userRatingCount',
      'editorialSummary', 'types', 'googleMapsUri', 'websiteUri',
    ].join(','));
  } catch (err) {
    console.warn('[Place Details]', err.message);
    return null;
  }
};

// ─── 3. Photo URL — skipHttpRedirect=true returns JSON with photoUri ──────────
// photoUri is a stable lh3.googleusercontent.com URL that works in <img> tags.

// The photo `name` returned by the Places (New) API already begins with
// "places/<id>/photos/<photo>". PLACES_BASE also ends in "/places", so we must
// NOT concatenate them naively or we get "…/v1/places/places/…" → 404 (which is
// why no place photos were ever loading). Build the media URL correctly here.
const buildPhotoMediaUrl = (photoName, maxH, maxW, { skipHttpRedirect = false } = {}) => {
  if (!photoName) return null;
  const name = photoName.startsWith('places/')
    ? photoName
    : `places/${photoName}`;
  const v1Base = PLACES_BASE.replace(/\/places$/, ''); // → https://places.googleapis.com/v1
  let url = `${v1Base}/${name}/media?maxHeightPx=${maxH}&maxWidthPx=${maxW}&key=${GOOGLE_API_KEY}`;
  if (skipHttpRedirect) url += '&skipHttpRedirect=true';
  return url;
};

export const resolvePhotoUrl = async (photoName, maxH = 800, maxW = 1200) => {
  if (!photoName) return null;
  const mediaUrl = buildPhotoMediaUrl(photoName, maxH, maxW, { skipHttpRedirect: true });
  if (!mediaUrl) return null;
  try {
    const res = await fetch(mediaUrl);
    if (!res.ok) return null;
    const data = await res.json();
    // Some responses include a photoUri pointing at lh3.googleusercontent.com;
    // fall back to a Google redirect URL if it isn't present.
    if (data?.photoUri) return data.photoUri;
    const redirected = buildPhotoMediaUrl(photoName, maxH, maxW);
    return redirected || null;
  } catch {
    return null;
  }
};

// Synchronous URL builder — browser follows the redirect automatically.
// Use this for <img src> when you don't need to pre-resolve the URL.
export const getPlacePhotoUrl = (photoName, maxH = 800, maxW = 1200) => {
  // skipHttpRedirect=false (default) → browser gets redirect → final image
  return buildPhotoMediaUrl(photoName, maxH, maxW);
};

// ─── 4. Text Search — any free-text query ────────────────────────────────────

export const fetchTextSearch = async (textQuery, locationBias = null, maxResults = 10) => {
  try {
    const body = { textQuery, maxResultCount: maxResults, languageCode: 'en' };
    if (locationBias) body.locationBias = locationBias;
    const data = await placesPost(':searchText', body, [
      'places.id', 'places.displayName', 'places.formattedAddress',
      'places.location', 'places.photos', 'places.rating',
      'places.userRatingCount', 'places.editorialSummary',
      'places.types', 'places.googleMapsUri', 'places.websiteUri',
      'places.priceLevel',
    ].join(','));
    return data.places || [];
  } catch (err) {
    console.warn('[Text Search]', err.message);
    return [];
  }
};

// ─── 5. Nearby Search ────────────────────────────────────────────────────────

export const fetchNearbyPlaces = async (lat, lng, radiusMeters = 10000, includedTypes = []) => {
  try {
    const data = await placesPost(':searchNearby', {
      includedTypes: includedTypes.length ? includedTypes
        : ['tourist_attraction', 'historical_landmark', 'museum', 'park', 'natural_feature'],
      maxResultCount: 12,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
      rankPreference: 'POPULARITY',
    }, [
      'places.id', 'places.displayName', 'places.formattedAddress',
      'places.location', 'places.rating', 'places.userRatingCount',
      'places.types', 'places.photos', 'places.googleMapsUri',
      'places.editorialSummary',
    ].join(','));
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
// Returns a direct lh3.googleusercontent.com URL (resolved via skipHttpRedirect).

export const getFirstPhotoUrl = async (place, maxH = 600, maxW = 900) => {
  const photoName = place?.photos?.[0]?.name;
  if (!photoName) return null;
  return resolvePhotoUrl(photoName, maxH, maxW);
};
