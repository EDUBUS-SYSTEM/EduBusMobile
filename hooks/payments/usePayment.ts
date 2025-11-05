import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    clearQrCode,
    clearTransactionDetail,
    clearTransactions,
    fetchTransactionDetail,
    fetchTransactions,
    generateQrCode,
    setFilter,
    setQrTimeRemaining,
    setRefreshing
} from '@/store/slices/paymentSlice';
import { useCallback } from 'react';

export const usePayment = () => {
  const dispatch = useAppDispatch();
  const payment = useAppSelector(state => state.payment);

  const loadTransactions = useCallback(async (page: number = 1) => {
    await dispatch(fetchTransactions({ page }));
  }, [dispatch]);

  const loadTransactionDetail = useCallback(async (transactionId: string) => {
    await dispatch(fetchTransactionDetail(transactionId));
  }, [dispatch]);

  const generateQr = useCallback(async (transactionId: string) => {
    await dispatch(generateQrCode(transactionId));
  }, [dispatch]);

  const changeFilter = useCallback((filter: 'all' | 'pending' | 'paid') => {
    dispatch(setFilter(filter));
  }, [dispatch]);

  const refreshTransactions = useCallback(async () => {
    dispatch(setRefreshing(true));
    dispatch(clearTransactions());
    await dispatch(fetchTransactions({ page: 1 }));
    dispatch(setRefreshing(false));
  }, [dispatch]);

  return {
    // State
    ...payment,
    
    // Actions
    loadTransactions,
    loadTransactionDetail,
    generateQr,
    changeFilter,
    refreshTransactions,
    clearDetail: () => dispatch(clearTransactionDetail()),
    clearQr: () => dispatch(clearQrCode()),
    setQrTimeRemaining: (time: number) => dispatch(setQrTimeRemaining(time)),
  };
};