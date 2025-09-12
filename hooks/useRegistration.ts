import { authApi } from "@/lib/auth/auth.api";
import { registrationApi } from "@/lib/parent/registration.api";
import type { RegistrationStatus, RegistrationInfo, PaymentRequest, PaymentResponse } from "@/lib/parent/registration.type";
import { useEffect, useState } from "react";

export const useRegistrationStatus = () => {
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = await authApi.getUserInfo();
      if (!userInfo.userId) {
        throw new Error("User ID not found");
      }

      const registrationStatus = await registrationApi.getRegistrationStatus(userInfo.userId);
      setStatus(registrationStatus);
    } catch (err: any) {
      console.error("Error loading registration status:", err);
      setError(err.message || "Failed to load registration status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return {
    status,
    loading,
    error,
    refetch: loadStatus,
  };
};

export const useRegistrationInfo = (registrationId: string | null) => {
  const [info, setInfo] = useState<RegistrationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInfo = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const registrationInfo = await registrationApi.getRegistrationInfo(id);
      setInfo(registrationInfo);
    } catch (err: any) {
      console.error("Error loading registration info:", err);
      setError(err.message || "Failed to load registration info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (registrationId) {
      loadInfo(registrationId);
    }
  }, [registrationId]);

  return {
    info,
    loading,
    error,
    refetch: registrationId ? () => loadInfo(registrationId) : undefined,
  };
};

export const usePayment = () => {
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (registrationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const request = await registrationApi.createPaymentRequest(registrationId);
      setPaymentRequest(request);
      return request;
    } catch (err: any) {
      console.error("Error creating payment:", err);
      setError(err.message || "Failed to create payment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const status = await registrationApi.checkPaymentStatus(paymentId);
      setPaymentStatus(status);
      return status;
    } catch (err: any) {
      console.error("Error checking payment status:", err);
      setError(err.message || "Failed to check payment status");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentId: string, transactionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await registrationApi.confirmPayment(paymentId, transactionId);
      return result;
    } catch (err: any) {
      console.error("Error confirming payment:", err);
      setError(err.message || "Failed to confirm payment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    paymentRequest,
    paymentStatus,
    loading,
    error,
    createPayment,
    checkPaymentStatus,
    confirmPayment,
  };
};
