import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { paymentApi } from '@/lib/payment/payment.api';
import {
  TransactionSummary,
  TransactionStatus,
  getStatusColor,
  getStatusText,
  formatCurrency,
  formatDate,
} from '@/lib/payment/payment.type';

export default function PaymentsScreen() {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  const loadTransactions = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }
      setError(null);

      // Get all transactions from backend
      const response = await paymentApi.getMyTransactions(pageNum, 20);
      
      // Client-side filtering based on selected filter
      let filteredTransactions = response.transactions;
      if (filter === 'pending') {
        filteredTransactions = response.transactions.filter(
          t => t.status === TransactionStatus.Notyet
        );
      } else if (filter === 'paid') {
        filteredTransactions = response.transactions.filter(
          t => t.status === TransactionStatus.Paid
        );
      }
      
      if (refresh || pageNum === 1) {
        setTransactions(filteredTransactions);
      } else {
        setTransactions(prev => [...prev, ...filteredTransactions]);
      }
      
      // Update total count based on filter
      if (filter === 'pending') {
        const pendingCount = response.transactions.filter(
          t => t.status === TransactionStatus.Notyet
        ).length;
        setTotalCount(pendingCount);
      } else if (filter === 'paid') {
        const paidCount = response.transactions.filter(
          t => t.status === TransactionStatus.Paid
        ).length;
        setTotalCount(paidCount);
      } else {
        setTotalCount(response.totalCount);
      }
      
      setHasMore(pageNum < response.totalPages);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to load payment list');
      console.error('Load transactions error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions(1);
  }, [filter]);

  const handleRefresh = () => {
    loadTransactions(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadTransactions(page + 1);
    }
  };

  const renderTransaction = ({ item }: { item: TransactionSummary }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(parent-tabs)/payment-detail?id=${item.id}`)}
      style={styles.transactionCard}
      activeOpacity={0.8}
    >
      {/* Status Badge at Top */}
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons 
            name={item.status === TransactionStatus.Paid ? "checkmark-circle" : "time"} 
            size={14} 
            color="#FFFFFF" 
          />
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
        {item.status === TransactionStatus.Notyet && (
          <Ionicons name="arrow-forward-circle" size={20} color="#FF9800" />
        )}
      </View>

      {/* Main Content */}
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={32} color="#01CBCA" />
        </View>
        
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle} numberOfLines={1}>
            {item.description || 'Bus Fee Payment'}
          </Text>
          <Text style={styles.transactionCode}>#{item.transactionCode}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{formatDate(item.createdAt)}</Text>
            </View>
            {item.studentCount > 0 && (
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={14} color="#666" />
                <Text style={styles.detailText}>{item.studentCount} student{item.studentCount > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Amount Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.amountLabel}>Amount</Text>
        <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
      </View>

      {/* Tap Hint */}
      {item.status === TransactionStatus.Notyet && (
        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>Tap to pay now</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
        onPress={() => setFilter('all')}
      >
        <Ionicons 
          name="list" 
          size={18} 
          color={filter === 'all' ? '#FFFFFF' : '#666'} 
        />
        <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
        onPress={() => setFilter('pending')}
      >
        <Ionicons 
          name="time" 
          size={18} 
          color={filter === 'pending' ? '#FFFFFF' : '#666'} 
        />
        <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]}>
          Pending
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterTab, filter === 'paid' && styles.filterTabActive]}
        onPress={() => setFilter('paid')}
      >
        <Ionicons 
          name="checkmark-circle" 
          size={18} 
          color={filter === 'paid' ? '#FFFFFF' : '#666'} 
        />
        <Text style={[styles.filterTabText, filter === 'paid' && styles.filterTabTextActive]}>
          Paid
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && page === 1 && transactions.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFD700', '#FFEB3B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>💳 Payments</Text>
          <Text style={styles.headerSubtitle}>Manage bus fee payments</Text>
        </LinearGradient>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#01CBCA" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      </View>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFD700', '#FFEB3B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>💳 Payments</Text>
          <Text style={styles.headerSubtitle}>Manage bus fee payments</Text>
        </LinearGradient>
        <View style={styles.centerContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color="#FF9800" />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#FFD700', '#FFEB3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>💳 Payments</Text>
            <Text style={styles.headerSubtitle}>Manage bus fee payments</Text>
          </View>
          {totalCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{totalCount}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Transaction List */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={['#01CBCA']} 
            tintColor="#01CBCA"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && page > 1 ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color="#01CBCA" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={80} color="#E0E0E0" />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'pending' 
                ? 'No Pending Payments' 
                : filter === 'paid'
                ? 'No Payment History'
                : 'No Transactions Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'pending' 
                ? 'You have no payments waiting' 
                : filter === 'paid'
                ? 'Your payment history will appear here'
                : 'Your transactions will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 28,
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#000000',
    opacity: 0.8,
  },
  countBadge: {
    backgroundColor: '#01CBCA',
    borderRadius: 20,
    minWidth: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  countBadgeText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#01CBCA',
    shadowColor: '#01CBCA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 13,
    color: '#666',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'RobotoSlab-Bold',
    textTransform: 'uppercase',
  },
  cardContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  transactionCode: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 11,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF9C4',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  amountLabel: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 18,
    color: '#01CBCA',
  },
  tapHint: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    alignItems: 'center',
  },
  tapHintText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 11,
    color: '#FF9800',
    textTransform: 'uppercase',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#666',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#01CBCA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#01CBCA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
