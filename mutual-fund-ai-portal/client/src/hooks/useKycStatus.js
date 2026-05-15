import { useEffect, useState, useCallback } from "react";
import API from "../services/api";

// KYC status constants
export const KYC_STATUS = {
  NOT_SUBMITTED: "NOT_SUBMITTED",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
};

/**
 * Hook that fetches the current user's profile and exposes KYC-related state.
 * Returns { kycStatus, kycRejectionReason, isVerified, loading, user, refetch }
 */
export function useKycStatus() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/users/profile");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const kycStatus = user?.kycStatus ?? KYC_STATUS.NOT_SUBMITTED;
  const isVerified = kycStatus === KYC_STATUS.VERIFIED;

  return {
    user,
    kycStatus,
    kycRejectionReason: user?.kycRejectionReason ?? null,
    isVerified,
    loading,
    refetch: fetchProfile,
  };
}
