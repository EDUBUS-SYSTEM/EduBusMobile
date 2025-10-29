import { paymentApi } from '@/lib/payment/payment.api';
import {
  QrResponse,
  TransactionDetail,
  TransactionStatus,
  TransactionSummary
} from '@/lib/payment/payment.type';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PaymentState {
  // Transactions list state
  transactions: TransactionSummary[];
  filteredTransactions: TransactionSummary[];
  totalCount: number;
  page: number;
  hasMore: boolean;
  filter: 'all' | 'pending' | 'paid';
  loadingList: boolean;
  errorList: string | null;
  
  // Transaction detail state
  transactionDetail: TransactionDetail | null;
  loadingDetail: boolean;
  errorDetail: string | null;
  
  // QR code state
  qrCode: QrResponse | null;
  loadingQr: boolean;
  errorQr: string | null;
  qrTimeRemaining: number;
  
  // Refresh state
  refreshing: boolean;
}

const initialState: PaymentState = {
  transactions: [],
  filteredTransactions: [],
  totalCount: 0,
  page: 1,
  hasMore: true,
  filter: 'all',
  loadingList: false,
  errorList: null,
  
  transactionDetail: null,
  loadingDetail: false,
  errorDetail: null,
  
  qrCode: null,
  loadingQr: false,
  errorQr: null,
  qrTimeRemaining: 0,
  
  refreshing: false,
};

// Thunk actions
export const fetchTransactions = createAsyncThunk(
  'payment/fetchTransactions',
  async ({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number }, { rejectWithValue }) => {
    try {
      const response = await paymentApi.getMyTransactions(page, pageSize);
      return { response, page };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load transactions');
    }
  }
);

export const fetchTransactionDetail = createAsyncThunk(
  'payment/fetchTransactionDetail',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const data = await paymentApi.getTransactionDetail(transactionId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load transaction details');
    }
  }
);

export const generateQrCode = createAsyncThunk(
  'payment/generateQrCode',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const qr = await paymentApi.generateQrCode(transactionId);
      return qr;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to generate QR code');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<'all' | 'pending' | 'paid'>) => {
      state.filter = action.payload;
      // Filter transactions based on status
      if (action.payload === 'all') {
        state.filteredTransactions = state.transactions;
      } else if (action.payload === 'pending') {
        state.filteredTransactions = state.transactions.filter(t => t.status === TransactionStatus.Notyet);
      } else if (action.payload === 'paid') {
        state.filteredTransactions = state.transactions.filter(t => t.status === TransactionStatus.Paid);
      }
    },
    
    clearTransactions: (state) => {
      state.transactions = [];
      state.filteredTransactions = [];
      state.page = 1;
      state.totalCount = 0;
      state.hasMore = true;
      state.errorList = null;
    },
    
    setQrTimeRemaining: (state, action: PayloadAction<number>) => {
      state.qrTimeRemaining = action.payload;
    },
    
    clearQrCode: (state) => {
      state.qrCode = null;
      state.qrTimeRemaining = 0;
    },
    
    clearTransactionDetail: (state) => {
      state.transactionDetail = null;
      state.errorDetail = null;
    },
    
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
    
    // Update transaction detail from real-time SignalR event
    updateTransactionDetail: (state, action: PayloadAction<TransactionDetail>) => {
      const updatedTransaction = action.payload;
      
      // Update the detail view if it's the same transaction
      if (state.transactionDetail?.id === updatedTransaction.id) {
        state.transactionDetail = updatedTransaction;
        state.loadingDetail = false;
        state.errorDetail = null;
      }
      
      // Also update in the transactions list
      const index = state.transactions.findIndex(t => t.id === updatedTransaction.id);
      if (index !== -1) {
        // Update summary fields in the list
        state.transactions[index] = {
          ...state.transactions[index],
          status: updatedTransaction.status,
          amount: updatedTransaction.amount,
          createdAt: updatedTransaction.createdAt,
        };
        
        // Re-apply filter
        if (state.filter === 'all') {
          state.filteredTransactions = state.transactions;
        } else if (state.filter === 'pending') {
          state.filteredTransactions = state.transactions.filter(t => t.status === TransactionStatus.Notyet);
        } else if (state.filter === 'paid') {
          state.filteredTransactions = state.transactions.filter(t => t.status === TransactionStatus.Paid);
        }
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        if (state.page === 1) {
          state.loadingList = true;
        }
        state.errorList = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        const { response, page } = action.payload;
        
        // Apply client-side filtering
        let filtered = response.transactions;
        if (state.filter === 'pending') {
          filtered = response.transactions.filter(t => t.status === TransactionStatus.Notyet);
        } else if (state.filter === 'paid') {
          filtered = response.transactions.filter(t => t.status === TransactionStatus.Paid);
        }
        
        if (page === 1) {
          state.transactions = response.transactions;
          state.filteredTransactions = filtered;
        } else {
          state.transactions = [...state.transactions, ...response.transactions];
          state.filteredTransactions = [...state.filteredTransactions, ...filtered];
        }
        
        state.totalCount = response.totalCount;
        state.page = page;
        state.hasMore = page < response.totalPages;
        state.loadingList = false;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loadingList = false;
        state.errorList = action.payload as string;
      })
      
      // Fetch Transaction Detail
      .addCase(fetchTransactionDetail.pending, (state) => {
        state.loadingDetail = true;
        state.errorDetail = null;
      })
      .addCase(fetchTransactionDetail.fulfilled, (state, action) => {
        state.transactionDetail = action.payload;
        state.loadingDetail = false;
      })
      .addCase(fetchTransactionDetail.rejected, (state, action) => {
        state.loadingDetail = false;
        state.errorDetail = action.payload as string;
      })
      
      // Generate QR Code
      .addCase(generateQrCode.pending, (state) => {
        state.loadingQr = true;
        state.errorQr = null;
      })
      .addCase(generateQrCode.fulfilled, (state, action) => {
        state.qrCode = action.payload;
        state.loadingQr = false;
        
        // Calculate time remaining
        const expiryTime = new Date(action.payload.expiresAt).getTime();
        const now = Date.now();
        state.qrTimeRemaining = Math.floor((expiryTime - now) / 1000);
      })
      .addCase(generateQrCode.rejected, (state, action) => {
        state.loadingQr = false;
        state.errorQr = action.payload as string;
      });
  },
});

export const { 
  setFilter, 
  clearTransactions, 
  clearQrCode, 
  clearTransactionDetail,
  setQrTimeRemaining,
  setRefreshing,
  updateTransactionDetail 
} = paymentSlice.actions;

export default paymentSlice.reducer;