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
