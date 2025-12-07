import { StudentAvatar } from '@/components/StudentAvatar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MultipleStudentAvatarsProps {
  students: Array<{
    id: string;
    name: string;
    studentImageId?: string | null;
  }>;
  size?: number;
  maxVisible?: number;
  showBorder?: boolean;
  style?: any;
}

/**
 * Component to display multiple student avatars in a group chat style (overlapping)
 */
export function MultipleStudentAvatars({
  students,
  size = 50,
  maxVisible = 3,
  showBorder = false,
  style
}: MultipleStudentAvatarsProps) {
  if (!students || students.length === 0) {
    return null;
  }

  // If only one student, use regular StudentAvatar
  if (students.length === 1) {
    return (
      <StudentAvatar
        studentId={students[0].id}
        studentName={students[0].name}
        studentImageId={students[0].studentImageId}
        size={size}
        showBorder={showBorder}
        style={style}
      />
    );
  }

  // Show up to maxVisible avatars, with overlap
  const visibleStudents = students.slice(0, maxVisible);
  const remainingCount = students.length - maxVisible;

  // Calculate overlap offset (each avatar overlaps by 30% of its size)
  const overlapOffset = size * 0.3;
  const containerWidth = size + (visibleStudents.length - 1) * overlapOffset + (remainingCount > 0 ? overlapOffset : 0);

  return (
    <View style={[styles.container, { width: containerWidth, height: size }, style]}>
      {visibleStudents.map((student, index) => (
        <View
          key={student.id}
          style={[
            styles.avatarWrapper,
            {
              left: index * overlapOffset,
              zIndex: visibleStudents.length - index, // First avatar on top
            }
          ]}
        >
          <StudentAvatar
            studentId={student.id}
            studentName={student.name}
            studentImageId={student.studentImageId}
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
              left: visibleStudents.length * overlapOffset,
              width: size,
              height: size,
              borderRadius: size / 2,
              zIndex: 0,
            }
          ]}
        >
          <View style={[styles.remainingBadgeInner, { borderRadius: size / 2, width: size, height: size }]}>
            <Text style={[styles.remainingText, { fontSize: size * 0.3 }]}>
              +{remainingCount}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
  },
  avatarWrapper: {
    position: 'absolute',
  },
  remainingBadge: {
    position: 'absolute',
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
  remainingText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

