import type { AcademicSemester } from '@/lib/academicCalendar/academicCalendar.api';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SemesterFilterProps {
  semesters: AcademicSemester[];
  selectedSemester: AcademicSemester | null;
  onSelectSemester: (semester: AcademicSemester) => void;
}

export function SemesterFilter({
  semesters,
  selectedSemester,
  onSelectSemester,
}: SemesterFilterProps) {
  const formatSemesterName = (semester: AcademicSemester): string => {
    const startYear = new Date(semester.startDate).getFullYear();
    const endYear = new Date(semester.endDate).getFullYear();
    const semesterNumber = semester.name.includes('1') || semester.name.includes('First') ? '1' : '2';
    return `Semester ${semesterNumber} ${startYear}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {semesters.map((semester) => {
          const isSelected = selectedSemester?.code === semester.code;
          return (
            <TouchableOpacity
              key={semester.code}
              style={[styles.button, isSelected && styles.buttonSelected]}
              onPress={() => onSelectSemester(semester)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.buttonText,
                  isSelected && styles.buttonTextSelected,
                ]}>
                {formatSemesterName(semester)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF9C4',
    borderWidth: 1,
    borderColor: '#FDE370',
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSelected: {
    backgroundColor: '#FFDD00',
    borderColor: '#FCCF08',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Medium',
    color: '#6B7280',
  },
  buttonTextSelected: {
    color: '#000000',
    fontFamily: 'RobotoSlab-Bold',
  },
});

