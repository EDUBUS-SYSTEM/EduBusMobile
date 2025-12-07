import { StudentAvatar } from '@/components/StudentAvatar';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface StudentAvatarsRowProps {
  students: Array<{
    id: string;
    name: string;
  }>;
  size?: number;
  maxVisible?: number;
  showBorder?: boolean;
  style?: any;
}

/**
 * Component to display multiple student avatars in a row (non-overlapping, interleaved style)
 * Similar to group chat avatars but smaller and spaced out
 */
export function StudentAvatarsRow({
  students,
  size = 36,
  maxVisible = 4,
  showBorder = false,
  style
}: StudentAvatarsRowProps) {
  if (!students || students.length === 0) {
    return null;
  }

  // If only one student, use regular StudentAvatar
  if (students.length === 1) {
    return (
      <StudentAvatar
        studentId={students[0].id}
        studentName={students[0].name}
        size={size}
        showBorder={showBorder}
        style={style}
      />
    );
  }

  // Show up to maxVisible avatars, with spacing
  const visibleStudents = students.slice(0, maxVisible);
  const remainingCount = students.length - maxVisible;

  // Spacing between avatars (small gap)
  const spacing = 4;

  return (
    <View style={[styles.container, style]}>
      {visibleStudents.map((student, index) => (
        <View
          key={student.id}
          style={[
            styles.avatarWrapper,
            {
              marginLeft: index > 0 ? spacing : 0,
            }
          ]}
        >
          <StudentAvatar
            studentId={student.id}
            studentName={student.name}
            size={size}
            showBorder={showBorder}
          />
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={[
            styles.remainingBadge,
            {
              marginLeft: spacing,
              width: size,
              height: size,
              borderRadius: size / 2,
            }
          ]}
        >
          <View style={[styles.remainingBadgeInner, { borderRadius: size / 2, width: size, height: size }]}>
            <StudentAvatar
              studentId={`remaining-${remainingCount}`}
              studentName={`+${remainingCount}`}
              size={size}
              showBorder={showBorder}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    // No absolute positioning - just flex row
  },
  remainingBadge: {
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  remainingBadgeInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9CA3AF',
  },
});

