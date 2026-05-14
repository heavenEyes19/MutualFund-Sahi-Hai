import { cacheGet, cacheSet, TTL } from "../utils/cache.js";

const DEFAULT_LIST_LIMIT   = 12;
const DEFAULT_SEARCH_LIMIT = 15;
const MAX_LIMIT            = 50;

// A fund whose latest NAV is older than this many years is inactive/archived.
const INACTIVE_THRESHOLD_YEARS = 3;

// ─── Param helpers ────────────────────────────────────────────────────────────
const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};
const getLimit      = (v, fb) => Math.min(parsePositiveInteger(v, fb), MAX_LIMIT);
const getOffset     = (v)     => { const p = Number.parseInt(v, 10); return Number.isNaN(p) || p < 0 ? 0 : p; };
const getSchemeCode = (v)     => { const p = Number.parseInt(v, 10); return Number.isNaN(p) || p <= 0 ? null : p; };

// ─── NAV age helper ───────────────────────────────────────────────────────────
/** Returns the age in years of a "DD-MM-YYYY" NAV date string (Infinity if unparseable). */
const getNavAgeYears = (navDateStr) => {
  if (!navDateStr) return Infinity;
  const parts = navDateStr.split("-").map(Number);
  if (parts.length !== 3) return Infinity;
  const [day, month, year] = parts;
  return (Date.now() - new Date(year, month - 1, day).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
};

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
const buildMfApiUrl = (path, query = {}) => {
  const url = new URL(path, process.env.MFAPI_BASE_URL);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
};

/**
 * Fetches from mfapi with an optional AbortSignal.
 * Always throws on non-2xx so callers can catch uniformly.
 */
const fetchFromMfApi = async (path, query = {}, signal) => {
  const response = await fetch(buildMfApiUrl(path, query), signal ? { signal } : undefined);
  if (!response.ok) {
    let msg = `MF API ${response.status}`;
    try { const t = await response.text(); if (t) msg = t; } catch { /* ignore */ }
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }
  return response.json();
};

/**
 * Fetches from mfapi, checking the shared cache first.
 * cacheKey  – unique string for this request
 * ttlMs     – how long to cache a successful response
 */
const cachedFetch = async (cacheKey, path, query = {}, ttlMs) => {
  const hit = cacheGet(cacheKey);
  if (hit !== null) return hit;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 8000); // 8 s hard timeout
  try {
    const data = await fetchFromMfApi(path, query, controller.signal);
    clearTimeout(timeoutId);
    cacheSet(cacheKey, data, ttlMs);
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

const sendMfApiError = (res, error, message) =>
  res.status(error.status === 404 ? 404 : 502).json({ message, error: error.message });

// ─── Scheme classifier ────────────────────────────────────────────────────────
/**
 * Enriches a raw scheme object with `navDate` and `isActive`.
 * Uses cache.js so results persist for 6 hours.
 */
const classifyScheme = async (scheme) => {
  const cacheKey = `classify:${scheme.schemeCode}`;
  const hit = cacheGet(cacheKey);
  if (hit !== null) return hit;

  try {
    const latest  = await cachedFetch(
      `latest:${scheme.schemeCode}`,
      `/mf/${scheme.schemeCode}/latest`,
      {},
      TTL.NAV_LATEST
    );
    const navDate  = latest?.data?.[0]?.date ?? null;
    const result   = { ...scheme, navDate, isActive: getNavAgeYears(navDate) <= INACTIVE_THRESHOLD_YEARS };
    cacheSet(cacheKey, result, TTL.CLASSIFY);
    return result;
  } catch {
    const result = { ...scheme, navDate: null, isActive: true };
    cacheSet(cacheKey, result, TTL.CLASSIFY_ERR); // retry soon on error
    return result;
  }
};

/**
 * Classifies an array of schemes with concurrency=5 to avoid
 * overloading mfapi's DNS on cold starts.
 * Most results will be cache hits after the first request.
 */
const classifySchemes = async (schemes, concurrency = 5) => {
  const results = [];
  for (let i = 0; i < schemes.length; i += concurrency) {
    const batch = schemes.slice(i, i + concurrency);
    const out   = await Promise.all(batch.map(classifyScheme));
    results.push(...out);
  }
  return results;
};

// ─── Route handlers ───────────────────────────────────────────────────────────
export const listMutualFunds = async (req, res) => {
  const limit    = getLimit(req.query.limit, DEFAULT_LIST_LIMIT);
  const offset   = getOffset(req.query.offset);
  const poolSize = Math.min(limit * 2, 24); // conservative pool: max 24 schemes → 24 classify calls

  try {
    // Cache the raw scheme list (scheme codes + names only — very stable)
    const raw        = await cachedFetch(`list:${poolSize}:${offset}`, "/mf", { limit: poolSize, offset }, TTL.FUND_LIST);
    const allSchemes = Array.isArray(raw) ? raw : [];

    // Classification results are individually cached — only uncached ones hit mfapi
    const classified  = await classifySchemes(allSchemes);
    const active      = classified.filter((s) =>  s.isActive);
    const historical  = classified.filter((s) => !s.isActive);

    res.json({
      active:     active.slice(0, limit),
      historical: historical.slice(0, limit),
      counts:     { active: active.length, historical: historical.length },
      schemes:    active.slice(0, limit), // backward compat
      pagination: { limit, offset, count: active.length },
    });
  } catch (error) {
    sendMfApiError(res, error, "Unable to load mutual fund schemes right now.");
  }
};

export const searchMutualFunds = async (req, res) => {
  const query = req.query.q?.trim();
  if (!query || query.length < 2) {
    return res.status(400).json({ message: "Search query must be at least 2 characters long." });
  }
  const limit = getLimit(req.query.limit, DEFAULT_SEARCH_LIMIT);

  try {
    // Cache search results — the scheme list itself is stable; only NAV dates change
    const raw        = await cachedFetch(`search:${query.toLowerCase()}`, "/mf/search", { q: query }, TTL.SEARCH);
    const allSchemes = Array.isArray(raw) ? raw.slice(0, limit * 4) : [];

    const classified = await classifySchemes(allSchemes);
    const active     = classified.filter((s) =>  s.isActive);
    const historical = classified.filter((s) => !s.isActive);

    res.json({
      query,
      active:     active.slice(0, limit),
      historical: historical.slice(0, limit),
      counts:     { active: active.length, historical: historical.length },
      schemes:    classified.slice(0, limit),
      total:      classified.length,
    });
  } catch (error) {
    sendMfApiError(res, error, "Unable to search mutual funds right now.");
  }
};

export const getMutualFundDetails = async (req, res) => {
  const schemeCode = getSchemeCode(req.params.schemeCode);
  if (!schemeCode) {
    return res.status(400).json({ message: "A valid mutual fund scheme code is required." });
  }

  try {
    // Historical NAV data never changes retroactively — safe to cache for 12 hours.
    // We always fetch the FULL history (no date range) so the chart always renders.
    const [details, latestNav] = await Promise.all([
      cachedFetch(`details:full:${schemeCode}`, `/mf/${schemeCode}`, {}, TTL.FUND_DETAILS),
      cachedFetch(`latest:${schemeCode}`,       `/mf/${schemeCode}/latest`, {}, TTL.NAV_LATEST),
    ]);

    const latest  = Array.isArray(latestNav?.data) ? latestNav.data[0] || null : null;
    const navData = Array.isArray(details?.data)   ? details.data              : [];

    res.json({
      ...details,
      data:   navData,
      latest,
    });
  } catch (error) {
    sendMfApiError(res, error, "Unable to load mutual fund details right now.");
  }
};

export const getLatestMutualFundNav = async (req, res) => {
  const schemeCode = getSchemeCode(req.params.schemeCode);
  if (!schemeCode) {
    return res.status(400).json({ message: "A valid mutual fund scheme code is required." });
  }
  try {
    const latestNav = await cachedFetch(`latest:${schemeCode}`, `/mf/${schemeCode}/latest`, {}, TTL.NAV_LATEST);
    res.json(latestNav);
  } catch (error) {
    sendMfApiError(res, error, "Unable to load the latest NAV right now.");
  }
};
