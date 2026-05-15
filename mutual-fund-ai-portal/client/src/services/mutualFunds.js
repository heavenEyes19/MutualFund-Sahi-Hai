import API from "./api";

export const listMutualFunds = async ({ signal, ...params } = {}) => {
  const response = await API.get("/mutual-funds", {
    params,
    signal,
  });

  return response.data;
};

export const searchMutualFunds = async ({ signal, ...params } = {}) => {
  const response = await API.get("/mutual-funds/search", {
    params,
    signal,
  });

  return response.data;
};

export const getMutualFundDetails = async (schemeCode, { signal, ...params } = {}) => {
  const response = await API.get(`/mutual-funds/${schemeCode}`, {
    params,
    signal,
  });

  return response.data;
};

export const getTrendingFunds = async () => {
  const response = await API.get('/mutual-funds/trending');
  return response.data;
};

export const getTopPerformingFunds = async () => {
  const response = await API.get('/mutual-funds/top-performing');
  return response.data;
};

export const getFundCategories = async () => {
  const response = await API.get('/mutual-funds/categories');
  return response.data;
};

export const getRecommendedFunds = async () => {
  const response = await API.get('/mutual-funds/recommended');
  return response.data;
};
