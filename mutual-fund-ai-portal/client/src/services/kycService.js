import api from "./api";

const kycService = {
  // Investor: Submit KYC
  submitKYC: async (formData) => {
    // formData should be an instance of FormData
    const response = await api.post("/kyc/submit", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Investor: Get KYC status
  getKYCStatus: async () => {
    const response = await api.get("/kyc/status");
    return response.data;
  },

  // Admin: Get all KYCs
  getAllKYC: async () => {
    const response = await api.get("/kyc/all");
    return response.data;
  },

  // Admin: Verify KYC
  verifyKYC: async (id, status, rejectionReason = "") => {
    const response = await api.put(`/kyc/verify/${id}`, { status, rejectionReason });
    return response.data;
  },
};

export default kycService;
