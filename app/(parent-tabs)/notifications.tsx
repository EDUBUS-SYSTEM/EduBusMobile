import type { NotificationResponse } from '@/lib/notification/notification.api';
import {
  getNotificationIcon,
  getNotificationTypeLabel,
  NotificationType,
} from '@/lib/notification/notification.type';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchNotifications, markAllNotificationsAsRead } from '@/store/slices/notificationsSlice';
import { formatDateTime, formatRelativeDate } from '@/utils/date.utils';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const formatFullDate = (dateString: string): string => {
  return formatDateTime(dateString);
};

const isToday = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

export default function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const {
    items: notifications,
    loading,
    loadingMore,
    refreshing,
    error,
    page,
    hasMore,
  } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1 }));
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(markAllNotificationsAsRead());
    }, [dispatch]),
  );

  const handleRefresh = useCallback(() => {
    dispatch(fetchNotifications({ page: 1, append: false, isRefresh: true }));
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore && !refreshing) {
      dispatch(fetchNotifications({ page: page + 1, append: true }));
    }
  }, [dispatch, loading, loadingMore, hasMore, refreshing, page]);

  const groupedNotifications = useMemo(() => {
    const today: NotificationResponse[] = [];
    const earlier: NotificationResponse[] = [];

    notifications.forEach((notification) => {
      if (isToday(notification.createdAt)) {
        today.push(notification);
      } else {
        earlier.push(notification);
      }
    });

    const sections: { title: string; data: NotificationResponse[] }[] = [];
    if (today.length) {
      sections.push({ title: 'Today', data: today });
    }
    if (earlier.length) {
      sections.push({ title: 'Earlier', data: earlier });
    }

    return sections;
  }, [notifications]);

  const renderNotification = useCallback(
    ({ item }: { item: NotificationResponse }) => {
      const iconName = getNotificationIcon(item.type);
      const typeLabel = getNotificationTypeLabel(item.type);
      const relativeDate = formatRelativeDate(item.createdAt);
      const fullDate = formatFullDate(item.createdAt);

      return (
        <View
          style={[
            styles.notificationCard,
            item.isRead ? styles.readCard : styles.unreadCard,
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              item.type === NotificationType.EmergencyNotification && styles.emergencyIcon,
            ]}
          >
            <Ionicons
              name={iconName as any}
              size={24}
              color={
                item.type === NotificationType.EmergencyNotification ? '#FFFFFF' : '#01CBCA'
              }
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.typeLabel}>{typeLabel}</Text>
              <Text style={styles.timeText}>{relativeDate}</Text>
            </View>
            <Text style={styles.dateText}>{fullDate}</Text>
            <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.message} numberOfLines={3}>
              {item.message}
            </Text>
          </View>
        </View>
      );
    },
    [],
  );

  if (loading && page <= 1 && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFD700', '#FFEB3B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#01CBCA" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFD700', '#FFEB3B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
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
      {/* Header */}
      <LinearGradient
        colors={['#FFD700', '#FFEB3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Notification List */}
      <View style={styles.listContainer}>
        <SectionList
          sections={groupedNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
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
          loadingMore && page > 1 ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color="#01CBCA" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={80} color="#E0E0E0" />
            </View>
            <Text style={styles.emptyTitle}>
              No Notifications Yet
            </Text>
            <Text style={styles.emptyText}>
              You will receive notifications here when there are updates
            </Text>
          </View>
        }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 60,
    paddingBottom: 25,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
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
  listContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  readCard: {
    backgroundColor: '#FFFFFF',
  },
  unreadCard: {
    backgroundColor: '#FFF4D6',
    borderColor: '#F5C746',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emergencyIcon: {
    backgroundColor: '#FF5722',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeLabel: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 13,
    color: '#01CBCA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  timeText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 11,
    color: '#999',
  },
  dateText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#000',
    marginBottom: 6,
  },
  unreadTitle: {
    color: '#013440',
  },
  message: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
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

