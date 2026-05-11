import API from './api';

export const getPortfolio = async () => {
  const { data } = await API.get('/portfolio');
  return data;
};

export const buyFund = async (fundData) => {
  const { data } = await API.post('/portfolio/buy', fundData);
  return data;
};

export const sellFund = async (fundData) => {
  const { data } = await API.post('/portfolio/sell', fundData);
  return data;
};

export const getTransactions = async () => {
  const { data } = await API.get('/portfolio/transactions');
  return data;
};

export const createSIP = async (sipData) => {
  const { data } = await API.post('/sips', sipData);
  return data;
};

export const createRazorpayOrder = async (amount) => {
  const { data } = await API.post('/payment/create-order', { amount });
  return data;
};

export const verifyRazorpayPayment = async (paymentData) => {
  const { data } = await API.post('/payment/verify-payment', paymentData);
  return data;
};
