import { studentApi } from '@/lib/student/student.api';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthenticatedImage } from './AuthenticatedImage';

interface StudentAvatarProps {
  studentId: string;
  studentName: string;
  studentImageId?: string | null;
  size?: number;
  showBorder?: boolean;
  style?: any;
}

export function StudentAvatar({
  studentId,
  studentName,
  studentImageId,
  size = 48,
  showBorder = false,
  style
}: StudentAvatarProps) {
  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return '?';
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '');
    return letters.join('');
  };

  const initials = getInitials(studentName);
  // Always try to get photo URL - AuthenticatedImage will handle 404 and fallback to initials
  const avatarUrl = studentApi.getPhotoUrl(studentId);

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
      <AuthenticatedImage
        key={`student-${studentId}`}
        uri={avatarUrl}
        size={size}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        fallbackIcon="person"
        fallbackColor="#01CBCA"
        fallbackInitials={initials}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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

