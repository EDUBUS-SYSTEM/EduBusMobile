import { RelocationRequestCard } from '@/components/parent/RelocationRequestCard';
import { relocationRequestApi } from '@/lib/parent/relocationRequest.api';
import type { RelocationRequest } from '@/lib/parent/relocationRequest.type';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RelocationRequestsScreen() {
  const [requests, setRequests] = useState<RelocationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined
  );

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await relocationRequestApi.getMyRequests(
        selectedStatus
      );
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to load relocation requests:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, [loadRequests]);

  const handleRequestPress = (requestId: string) => {
    router.push(`/relocation-request/${requestId}` as any);
  };

  const handleCreateNew = () => {
    router.push('/relocation-request/create' as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relocation Requests</Text>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {['All', 'Pending', 'Approved', 'Rejected', 'AwaitingPayment'].map(
            (status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  (status === 'All' ? !selectedStatus : selectedStatus === status) &&
                  styles.filterChipActive,
                ]}
                onPress={() =>
                  setSelectedStatus(status === 'All' ? undefined : status)
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    (status === 'All' ? !selectedStatus : selectedStatus === status) &&
                    styles.filterChipTextActive,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#01CBCA" />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No relocation requests found</Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to create a new request
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {requests.map((request) => (
            <RelocationRequestCard
              key={request.id}
              request={request}
              onPress={() => handleRequestPress(request.id)}
            />
          ))}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateNew}>
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFF9C4',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#000',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  filterLabel: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filterChipActive: {
    backgroundColor: '#01CBCA',
    borderColor: '#01CBCA',
  },
  filterChipText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#01CBCA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
