import API from "./api";

export const getWalletDetails = async () => {
  const { data } = await API.get("/wallet/details");
  return data;
};

export const initiateTopup = async (amount) => {
  const { data } = await API.post("/wallet/topup/initiate", { amount });
  return data;
};

export const verifyTopup = async (paymentData) => {
  const { data } = await API.post("/wallet/topup/verify", paymentData);
  return data;
};

export const initiateWithdraw = async (amount, bankAccount) => {
  const { data } = await API.post("/wallet/withdraw/initiate", { amount, bankAccount });
  return data;
};

export const verifyWithdraw = async ({ mpin, amount, bankAccount }) => {
  const { data } = await API.post("/wallet/withdraw/verify", { mpin, amount, bankAccount });
  return data;
};
