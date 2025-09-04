import { authApi } from "@/lib/auth/auth.api";
import { childrenApi } from "@/lib/parent/children.api";
import type { Child } from "@/lib/parent/children.type";
import { useEffect, useState } from "react";

export const useChildrenList = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChildren = async () => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = await authApi.getUserInfo();

      if (!userInfo.userId) {
        console.warn(
          "User ID not found in storage. This might happen if the API response does not include userId."
        );
        setChildren([]);
        return;
      }

      const parentId = userInfo.userId;
      console.log("Using parentId from storage:", parentId);

      const childrenData = await childrenApi.getChildrenByParent(parentId);
      setChildren(childrenData);
    } catch (err: any) {
      console.error("Error loading children:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load children"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  return {
    children,
    loading,
    error,
    refetch: loadChildren,
  };
};

export const useChild = (childId: string | null) => {
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidGuid = (value: string) => {
    // Simple GUID v4 pattern check
    const guidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    return guidRegex.test(value);
  };

  const loadChild = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      if (!isValidGuid(id)) {
        throw new Error("Invalid child id format");
      }
      const childData = await childrenApi.getChildById(id);
      setChild(childData);
    } catch (err: any) {
      console.error("Error loading child:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load child details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (childId) {
      loadChild(childId);
    }
  }, [childId]);

  return {
    child,
    loading,
    error,
    refetch: childId ? () => loadChild(childId) : undefined,
  };
};
