import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthenticatedImage } from './AuthenticatedImage';

interface UserAvatarProps {
  avatarUrl?: string | null;
  userId?: string;
  userName?: string;
  size?: number;
  showBorder?: boolean;
  style?: any;
}

export function UserAvatar({
  avatarUrl,
  userId,
  userName,
  size = 70,
  showBorder = true,
  style
}: UserAvatarProps) {
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return '?';
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '');
    return letters.join('');
  };

  const initials = userName ? getInitials(userName) : null;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        showBorder && styles.border,
        style,
      ]}
    >
      {avatarUrl ? (
        <AuthenticatedImage
          key={`user-${userId || 'unknown'}-${avatarUrl}`}
          uri={avatarUrl}
          size={size}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          contentFit="cover"
          fallbackIcon="person"
          fallbackColor="#01CBCA"
        />
      ) : initials ? (
        <View style={styles.initialsContainer}>
          <Text style={[styles.initialsText, { fontSize: size * 0.35 }]}>
            {initials}
          </Text>
        </View>
      ) : (
        <Ionicons name="person" size={size * 0.5} color="#01CBCA" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  border: {
    borderWidth: 2,
    borderColor: '#FFF59D',
  },
  image: {
    backgroundColor: '#E0F7FA',
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#01CBCA',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

