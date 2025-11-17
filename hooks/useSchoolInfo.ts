import { useCallback, useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { API_CONFIG } from "@/constants/ApiConfig";
import type { SchoolInfoResponse } from "@/lib/types";

type UseSchoolInfoReturn = {
  schoolInfo: SchoolInfoResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const useSchoolInfo = (autoLoad = true): UseSchoolInfoReturn => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const loadSchoolInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get<SchoolInfoResponse>(
        API_CONFIG.ENDPOINTS.SCHOOL.INFO
      );
      setSchoolInfo(data);
    } catch (err) {
      console.warn("Failed to load school info", err);
      setError("Unable to load school information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadSchoolInfo();
    }
  }, [autoLoad, loadSchoolInfo]);

  return {
    schoolInfo,
    loading,
    error,
    refresh: loadSchoolInfo,
  };
};

