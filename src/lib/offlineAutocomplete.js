/**
 * Tripwise Offline City Autocomplete
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces Google Places Autocomplete (New) while the Cloud account is under
 * verification. Returns suggestion objects in the exact same shape that
 * CityAutocompleteInput already expects, so zero UI changes are needed.
 *
 * Algorithm:
 *   1. Exact prefix match on city name / aliases           (highest priority)
 *   2. Contains match anywhere in name / aliases           (medium priority)
 *   3. Trigram similarity against full alias list          (fuzzy fallback)
 */

import { CITY_DB } from './cityDatabase';

// ── trigram helpers ─────────────────────────────────────────────────────────

const trigrams = (str) => {
  const s = ` ${str.toLowerCase()} `;
  const out = new Set();
  for (let i = 0; i < s.length - 2; i++) out.add(s.slice(i, i + 3));
  return out;
};

const trigramSim = (a, b) => {
  if (!a || !b) return 0;
  const ta = trigrams(a);
  const tb = trigrams(b);
  let intersect = 0;
  ta.forEach((t) => { if (tb.has(t)) intersect++; });
  return (2 * intersect) / (ta.size + tb.size);
};

// Best similarity of query against any alias of a city
const bestSim = (city, query) =>
  Math.max(...city.aliases.map((a) => trigramSim(query, a)), trigramSim(city.name.toLowerCase(), query));

// ── main search ──────────────────────────────────────────────────────────────

/**
 * Search the city database for matches to `query`.
 * Returns up to `maxResults` suggestion objects shaped like Google Places
 * Autocomplete (New) responses so the existing `pick()` handler works.
 */
export const searchCities = (query, maxResults = 7) => {
  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();

  const scored = CITY_DB.map((city) => {
    const nameLower = city.name.toLowerCase();
    let score = 0;

    // Exact prefix on display name (highest signal)
    if (nameLower.startsWith(q)) score += 100;
    // Exact prefix on any alias
    else if (city.aliases.some((a) => a.startsWith(q))) score += 85;
    // Display name contains query
    else if (nameLower.includes(q)) score += 60;
    // Any alias contains query
    else if (city.aliases.some((a) => a.includes(q))) score += 50;
    // Trigram fuzzy (catches typos like "aurangbad", "mumabi")
    else {
      const sim = bestSim(city, q);
      if (sim > 0.35) score += Math.round(sim * 40);
    }

    return { city, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ city }) => buildSuggestion(city));
};

// ── shape builder ────────────────────────────────────────────────────────────

/**
 * Builds a suggestion object that mirrors the Google Places Autocomplete (New)
 * response shape so CityAutocompleteInput works without modification.
 *
 * Shape used by the UI:
 *   s.placePrediction.structuredFormat.mainText.text       → city name
 *   s.placePrediction.structuredFormat.secondaryText.text  → "State, India"
 *   s.placePrediction.placeId                             → city.id
 *   s._cityData                                            → full city record (extra)
 */
const buildSuggestion = (city) => ({
  placePrediction: {
    placeId: city.id,
    place: `places/${city.id}`,
    text: { text: `${city.name}, ${city.state}, India` },
    structuredFormat: {
      mainText: { text: city.name },
      secondaryText: { text: `${city.state}, India` },
    },
  },
  // Convenience: attach the full city record so BudgetEstimator can read
  // coordinates, gems, cover image etc. without a second lookup.
  _cityData: city,
});

// ── re-export a drop-in replacement for fetchPlaceAutocomplete ────────────────

/**
 * Drop-in async wrapper — same signature as fetchPlaceAutocomplete().
 * Returns a Promise so callers don't need to change anything.
 */
export const fetchPlaceAutocompleteOffline = async (inputQuery) => {
  // Tiny artificial delay so the spinner shows naturally
  await new Promise((r) => setTimeout(r, 80));
  return searchCities(inputQuery);
};
