import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TermsModalProps {
  visible: boolean;
  childName: string;
  onAgree: () => void;
  onCancel: () => void;
}

export default function TermsModal({
  visible,
  childName,
  onAgree,
  onCancel,
}: TermsModalProps) {
  const [agreed, setAgreed] = useState(false);

  const handleAgree = () => {
    if (agreed) {
      setAgreed(false); // Reset checkbox
      onAgree();
    }
  };

  const handleCancel = () => {
    setAgreed(false); // Reset checkbox when closing
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={32} color="#01CBCA" />
            <Text style={styles.title}>Face Registration</Text>
            <Text style={styles.subtitle}>
              Biometric Data Collection Agreement
            </Text>
          </View>

          {/* Terms Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>📋 Terms & Conditions</Text>

            <View style={styles.section}>
              <Text style={styles.sectionHeading}>1. Purpose of Data Collection</Text>
              <Text style={styles.sectionText}>
                {childName}&apos;s face data will be used for:
              </Text>
              <Text style={styles.bulletPoint}>
                • Identity verification for EduBus system
              </Text>
              <Text style={styles.bulletPoint}>
                • Improving safe transportation services
              </Text>
              <Text style={styles.bulletPoint}>
                • Monitoring and managing students on vehicles
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeading}>2. Data Security</Text>
              <Text style={styles.sectionText}>
                • Data is encrypted and stored securely
              </Text>
              <Text style={styles.sectionText}>
                • Only accessed by EduBus system
              </Text>
              <Text style={styles.sectionText}>
                • Not shared with third parties
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeading}>3. Parental Rights</Text>
              <Text style={styles.sectionText}>
                • Right to request data deletion
              </Text>
              <Text style={styles.sectionText}>
                • Right to decline service usage
              </Text>
              <Text style={styles.sectionText}>
                • Right to access your child&apos;s data
              </Text>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={24} color="#FF9800" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.warningTitle}>⚠️ Important Notice</Text>
                <Text style={styles.warningText}>
                  Face Registration is performed ONLY ONCE. Please follow instructions carefully to ensure the best data quality.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeading}>4. Capture Instructions</Text>
              <Text style={styles.sectionText}>
                • Ensure adequate lighting
              </Text>
              <Text style={styles.sectionText}>
                • Face must be clear and not obscured
              </Text>
              <Text style={styles.sectionText}>
                • Follow angle instructions on screen
              </Text>
              <Text style={styles.sectionText}>
                • Do not move too quickly
              </Text>
            </View>
          </ScrollView>

          {/* Checkbox Agreement */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreed(!agreed)}
          >
            <View
              style={[
                styles.checkbox,
                agreed && styles.checkboxChecked,
              ]}
            >
              {agreed && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.checkboxText}>
              I agree to the terms and ready to perform Face Registration
            </Text>
          </TouchableOpacity>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.continueButton,
                !agreed && styles.buttonDisabled,
              ]}
              onPress={handleAgree}
              disabled={!agreed}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#000000',
    marginTop: 12,
  },
  subtitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: '60%',
  },
  sectionTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#01CBCA',
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 13,
    color: '#000000',
    marginBottom: 8,
  },
  sectionText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
    marginBottom: 4,
  },
  bulletPoint: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
    marginBottom: 4,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 12,
    color: '#FF9800',
    marginBottom: 4,
  },
  warningText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 11,
    color: '#E65100',
    lineHeight: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#01CBCA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#01CBCA',
    borderColor: '#01CBCA',
  },
  checkboxText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#666',
  },
  continueButton: {
    backgroundColor: '#01CBCA',
  },
  continueButtonText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
});
