// const MFAPI_BASE_URL = "MFAPI_BASE_URL";
const MFAPI_BASE_URL = process.env.MFAPI_BASE_URL;

// console.log("MFAPI BASE URL:", MFAPI_BASE_URL);
const DEFAULT_LIST_LIMIT = 12;
const DEFAULT_SEARCH_LIMIT = 15;
const DEFAULT_HISTORY_WINDOW_DAYS = 90;
const MAX_LIMIT = 50;

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const getLimit = (value, fallback) =>
  Math.min(parsePositiveInteger(value, fallback), MAX_LIMIT);

const getOffset = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
};

const getSchemeCode = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const formatDateForApi = (date) => date.toISOString().split("T")[0];

const getDefaultRange = () => {
  const endDate = new Date();
  const startDate = new Date(endDate);

  startDate.setDate(startDate.getDate() - DEFAULT_HISTORY_WINDOW_DAYS);

  return {
    startDate: formatDateForApi(startDate),
    endDate: formatDateForApi(endDate),
  };
};

const buildMfApiUrl = (path, query = {}) => {
  const url = new URL(path, process.env.MFAPI_BASE_URL);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

const fetchFromMfApi = async (path, query = {}) => {
  const response = await fetch(buildMfApiUrl(path, query));

  if (!response.ok) {
    let errorMessage = `MF API request failed with status ${response.status}`;

    try {
      const responseText = await response.text();

      if (responseText) {
        errorMessage = responseText;
      }
    } catch {
      // Fall back to the default message when the upstream error body cannot be read.
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return response.json();
};

const sendMfApiError = (res, error, message) => {
  const status = error.status === 404 ? 404 : 502;

  return res.status(status).json({
    message,
    error: error.message,
  });
};

export const listMutualFunds = async (req, res) => {
  const limit = getLimit(req.query.limit, DEFAULT_LIST_LIMIT);
  const offset = getOffset(req.query.offset);

  try {
    const schemes = await fetchFromMfApi("/mf", { limit, offset });

    res.json({
      schemes: Array.isArray(schemes) ? schemes : [],
      pagination: {
        limit,
        offset,
        count: Array.isArray(schemes) ? schemes.length : 0,
      },
    });
  } catch (error) {
    sendMfApiError(res, error, "Unable to load mutual fund schemes right now.");
  }
};

export const searchMutualFunds = async (req, res) => {
  const query = req.query.q?.trim();

  if (!query || query.length < 2) {
    return res.status(400).json({
      message: "Search query must be at least 2 characters long.",
    });
  }

  const limit = getLimit(req.query.limit, DEFAULT_SEARCH_LIMIT);

  try {
    const schemes = await fetchFromMfApi("/mf/search", { q: query });
    const normalizedSchemes = Array.isArray(schemes) ? schemes.slice(0, limit) : [];

    res.json({
      query,
      schemes: normalizedSchemes,
      total: Array.isArray(schemes) ? schemes.length : 0,
    });
  } catch (error) {
    sendMfApiError(res, error, "Unable to search mutual funds right now.");
  }
};

export const getMutualFundDetails = async (req, res) => {
  const schemeCode = getSchemeCode(req.params.schemeCode);

  if (!schemeCode) {
    return res.status(400).json({
      message: "A valid mutual fund scheme code is required.",
    });
  }

  const defaultRange = getDefaultRange();
  const startDate = req.query.startDate || defaultRange.startDate;
  const endDate = req.query.endDate || defaultRange.endDate;

  try {
    const [details, latestNav] = await Promise.all([
      fetchFromMfApi(`/mf/${schemeCode}`, { startDate, endDate }),
      fetchFromMfApi(`/mf/${schemeCode}/latest`),
    ]);

    res.json({
      ...details,
      latest: Array.isArray(latestNav?.data) ? latestNav.data[0] || null : null,
      requestedRange: {
        startDate,
        endDate,
      },
    });
  } catch (error) {
    sendMfApiError(res, error, "Unable to load mutual fund details right now.");
  }
};

export const getLatestMutualFundNav = async (req, res) => {
  const schemeCode = getSchemeCode(req.params.schemeCode);

  if (!schemeCode) {
    return res.status(400).json({
      message: "A valid mutual fund scheme code is required.",
    });
  }

  try {
    const latestNav = await fetchFromMfApi(`/mf/${schemeCode}/latest`);
    res.json(latestNav);
  } catch (error) {
    sendMfApiError(res, error, "Unable to load the latest NAV right now.");
  }
};
