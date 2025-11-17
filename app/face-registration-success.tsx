import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function FaceRegistrationSuccessScreen() {
  const router = useRouter();
  const { capturedCount, childName } = useLocalSearchParams();

  const handleBackToHome = () => {
    router.push('/(parent-tabs)/children-list');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        </View>

        {/* Success Title */}
        <Text style={styles.title}>Registration Successful!</Text>

        {/* Success Message */}
        <Text style={styles.message}>
          You have successfully registered {capturedCount} face images for {childName}.
        </Text>

        {/* Details */}
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Ionicons name="camera" size={20} color="#01CBCA" />
            <Text style={styles.detailText}>
              {capturedCount} images captured
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={20} color="#01CBCA" />
            <Text style={styles.detailText}>
              Student: {childName}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="checkmark" size={20} color="#4CAF50" />
            <Text style={styles.detailText}>
              Ready for verification
            </Text>
          </View>
        </View>

        {/* Info Message */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#FF9800" />
          <Text style={styles.infoText}>
            Results will be displayed in the notifications section. Please check back later for verification status.
          </Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleBackToHome}
        >
          <Ionicons name="home" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 28,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#E65100',
    flex: 1,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#01CBCA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  buttonText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
