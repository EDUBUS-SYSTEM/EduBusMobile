import type { ParentTripDto } from '@/lib/trip/parentTrip.types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TripCardProps {
  trip: ParentTripDto;
  onPress?: () => void;
}

export function TripCard({ trip, onPress }: TripCardProps) {
  const formatTime = (iso: string): string => {
    const date = new Date(iso);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
    return (first + last).toUpperCase();
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return {
          text: 'Scheduled',
          headerColor: '#0D6EFD',
          badgeColor: '#0D6EFD',
        };
      case 'InProgress':
        return {
          text: 'In Progress',
          headerColor: '#ffd60a',
          badgeColor: '#F59E0B',
        };
      case 'Completed':
        return {
          text: 'Completed',
          headerColor: '#4CAF50',
          badgeColor: '#4CAF50',
        };
      case 'Delayed':
        return {
          text: 'Delayed',
          headerColor: '#F44336',
          badgeColor: '#F44336',
        };
      case 'Cancelled':
        return {
          text: 'Cancelled',
          headerColor: '#FF0000',
          badgeColor: '#FF0000',
        };
      default:
        return {
          text: 'Not Yet',
          headerColor: '#757575',
          badgeColor: '#757575',
        };
    }
  };

  const statusInfo = getStatusInfo(trip.status);
  const timeRange = `${formatTime(trip.plannedStartAt)} - ${formatTime(trip.plannedEndAt)}`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}>
      {/* Card Body */}
      <View style={styles.body}>
        {/* Status Header */}
        <View style={[styles.statusHeader, { backgroundColor: statusInfo.headerColor }]}>
          <Text style={styles.statusHeaderText}>Status: {statusInfo.text}</Text>
        </View>

        {/* Child & shuttle info */}
        <View style={styles.childInfoRow}>
          {trip.childAvatar ? (
            <Image
              source={{ uri: trip.childAvatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitials}>
                {getInitials(trip.childName)}
              </Text>
            </View>
          )}

          <View style={styles.childDetails}>
            <Text style={styles.childName} numberOfLines={1}>
              {trip.childName}
            </Text>
            {trip.childClassName && (
              <Text style={styles.childClass} numberOfLines={1}>
                Class: {trip.childClassName}
              </Text>
            )}
          </View>
        </View>

        {/* Shuttle summary */}
        <View style={styles.tripInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={styles.infoText}>{timeRange}</Text>
          </View>

          {trip.vehicle && (
            <View style={styles.infoRow}>
              <Ionicons name="bus-outline" size={18} color="#6B7280" />
              <Text style={styles.infoText}>{trip.vehicle.maskedPlate}</Text>
            </View>
          )}

          {trip.driver && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={1}>
                {trip.driver.fullName}
              </Text>
            </View>
          )}

          {trip.pickupStop && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={1}>
                {trip.pickupStop.address || trip.pickupStop.pickupPointName}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF8CF',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  body: {
    padding: 0,
  },
  statusHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  statusHeaderText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Bold',
    color: '#FFFFFF',
  },
  childInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontFamily: 'RobotoSlab-Bold',
    color: '#FFFFFF',
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 17,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
    marginBottom: 2,
  },
  childClass: {
    fontSize: 13,
    fontFamily: 'RobotoSlab-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Medium',
    color: '#FFFFFF',
  },
  tripInfo: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Medium',
    color: '#000000',
    flex: 1,
  },
});

