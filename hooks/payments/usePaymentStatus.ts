import { authApi } from '@/lib/auth/auth.api';
import { paymentApi } from '@/lib/payment/payment.api';
import { UnpaidFeesResponse } from '@/lib/payment/payment.type';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

interface PaymentStatus extends UnpaidFeesResponse {
  isLoading: boolean;
}

const PAYMENT_STATUS_KEY = 'paymentStatus';

export const usePaymentStatus = () => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    hasUnpaidFees: false,
    count: 0,
    isLoading: true,
  });

  const checkPaymentStatus = useCallback(async () => {
    try {
      const userInfo = await authApi.getUserInfo();
      
      // Only check for Parent role
      if (userInfo.role !== 'Parent') {
        setPaymentStatus({
          hasUnpaidFees: false,
          count: 0,
          isLoading: false,
        });
        return;
      }

      const status = await paymentApi.checkUnpaidFees();
      
      // Store in AsyncStorage for quick access
      await AsyncStorage.setItem(PAYMENT_STATUS_KEY, JSON.stringify(status));
      
      setPaymentStatus({
        ...status,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking payment status:', error);
      // On error, try to load cached status
      const cached = await AsyncStorage.getItem(PAYMENT_STATUS_KEY);
      if (cached) {
        try {
          const status = JSON.parse(cached);
          setPaymentStatus({
            ...status,
            isLoading: false,
          });
        } catch (e) {
          setPaymentStatus({
            hasUnpaidFees: false,
            count: 0,
            isLoading: false,
          });
        }
      } else {
        setPaymentStatus({
          hasUnpaidFees: false,
          count: 0,
          isLoading: false,
        });
      }
    }
  }, []);

  const loadCachedStatus = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(PAYMENT_STATUS_KEY);
      if (cached) {
        const status = JSON.parse(cached);
        setPaymentStatus({
          ...status,
          isLoading: false,
        });
        return true;
      }
    } catch (error) {
      console.error('Error loading cached status:', error);
    }
    return false;
  }, []);

  useEffect(() => {
    // Load cached status first for quick display
    loadCachedStatus().then((hasCache) => {
      // Then check fresh status
      if (hasCache) {
        // Update in background without blocking UI
        checkPaymentStatus();
      } else {
        // No cache, check immediately
        checkPaymentStatus();
      }
    });
  }, [checkPaymentStatus, loadCachedStatus]);

  return {
    ...paymentStatus,
    refresh: checkPaymentStatus,
  };
};