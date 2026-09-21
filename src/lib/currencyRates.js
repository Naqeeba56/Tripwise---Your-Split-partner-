'use client';

/* ─────────────────────────────────────────────────────────────────────
   currencyRates.js
   Live FX rates via the free open.er-api.com endpoint (no API key needed)
   with a hard-coded fallback table so the converter never breaks offline.
   Rates are keyed as "units of {code} per 1 INR".
───────────────────────────────────────────────────────────────────── */

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', flag: '🇮🇳', name: 'Indian Rupee',   perINR: 1 },
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar',     perINR: 0.012 },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro',          perINR: 0.011 },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound', perINR: 0.0094 },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen',  perINR: 1.85 },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'Chinese Yuan',  perINR: 0.086 },
  { code: 'AED', symbol: 'د.إ', flag: '🇦🇪', name: 'UAE Dirham',    perINR: 0.0441 },
  { code: 'SGD', symbol: 'S$', flag: '🇸🇬', name: 'Singapore Dollar', perINR: 0.0161 },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺', name: 'Australian Dollar', perINR: 0.0182 },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦', name: 'Canadian Dollar', perINR: 0.0164 },
  { code: 'CHF', symbol: 'CHF', flag: '🇨🇭', name: 'Swiss Franc', perINR: 0.0107 },
  { code: 'NZD', symbol: 'NZ$', flag: '🇳🇿', name: 'NZ Dollar',   perINR: 0.0197 },
  { code: 'KWD', symbol: 'KD',  flag: '🇰🇼', name: 'Kuwaiti Dinar', perINR: 0.00369 },
  { code: 'THB', symbol: '฿',  flag: '🇹🇭', name: 'Thai Baht',    perINR: 0.43 },
  { code: 'MYR', symbol: 'RM',  flag: '🇲🇾', name: 'Malaysian Ringgit', perINR: 0.0566 },
  { code: 'IDR', symbol: 'Rp',  flag: '🇮🇩', name: 'Indonesian Rupiah', perINR: 190 },
  { code: 'NPR', symbol: 'रू', flag: '🇳🇵', name: 'Nepalese Rupee', perINR: 1.6 },
  { code: 'SEK', symbol: 'kr',  flag: '🇸🇪', name: 'Swedish Krona', perINR: 0.128 },
  { code: 'ZAR', symbol: 'R',   flag: '🇿🇦', name: 'S.African Rand', perINR: 0.221 },
];

export const FALLBACK_RATES = Object.fromEntries(CURRENCIES.map((c) => [c.code, c.perINR]));

let cached = null;
let cachedAt = 0;

export const currencyMeta = (code) =>
  CURRENCIES.find((c) => c.code === code) || { code, symbol: '', flag: '💱', name: code, perINR: 1 };

// Format using Intl with a graceful fallback to our symbol table.
export function formatMoney(value, code) {
  const meta = currencyMeta(code);
  const n = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: n >= 100 ? 0 : 2,
      minimumFractionDigits: n >= 100 ? 0 : (n < 1 ? 3 : 2),
    }).format(n);
  } catch (_) {
    const sym = meta.symbol || '';
    return `${sym}${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }
}

// Bouncy, readable currency×currency rate string (e.g. "1 USD = ₹83.33").
export function formatPairRate(rate) {
  if (!Number.isFinite(rate)) return '—';
  if (rate >= 1) return rate.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  if (rate >= 0.01) return rate.toLocaleString('en-IN', { maximumFractionDigits: 4 });
  return rate.toLocaleString('en-IN', { maximumFractionDigits: 6 });
}

/* Fetch live rates using INR as the base. Returns a { code: rate } map or
   the fallback table on any failure. Caches for 5 minutes. */
export async function fetchRates(base = 'INR', force = false) {
  const now = Date.now();
  if (!force && cached && now - cachedAt < 5 * 60 * 1000) return cached;

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Rates HTTP ${res.status}`);
    const json = await res.json();
    if (json && json.result === 'success' && json.rates) {
      cached = { ...FALLBACK_RATES, ...json.rates };
      cachedAt = now;
      return cached;
    }
  } catch (_e) {
    /* network / CORS / timeout — keep the fallback */
  }
  cached = { ...FALLBACK_RATES };
  cachedAt = now;
  return cached;
}