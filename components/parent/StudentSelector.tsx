import type { Child } from '@/lib/parent/children.type';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StudentSelectorProps {
  students: Child[];
  selectedChild: Child | null;
  onSelectChild: (child: Child | null) => void;
}

export function StudentSelector({
  students,
  selectedChild,
  onSelectChild,
}: StudentSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (child: Child | null) => {
    onSelectChild(child);
    setModalVisible(false);
  };

  const displayText = selectedChild
    ? `${selectedChild.firstName} ${selectedChild.lastName}`
    : 'Select Student';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}>
        <Text style={styles.selectorText} numberOfLines={1}>
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Student</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {students.map((child) => {
              const isSelected =
                selectedChild?.id === child.id;
              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => handleSelect(child)}>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}>
                    {child.firstName} {child.lastName}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#FFDD00" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  selector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '80%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  optionSelected: {
    backgroundColor: '#FFF9C4',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
    color: '#000000',
  },
  optionTextSelected: {
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
});

