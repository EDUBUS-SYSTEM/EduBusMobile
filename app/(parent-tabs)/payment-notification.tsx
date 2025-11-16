import { usePaymentStatus } from '@/hooks/payments/usePaymentStatus';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function PaymentNotificationScreen() {
  const { hasUnpaidFees, count, isLoading } = usePaymentStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoToPayments = () => {
    router.replace('/(parent-tabs)/payments' as any);
  };

  const handleClose = () => {
    router.replace('/(parent-tabs)/home' as any);
  };

  if (isLoading || !mounted) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Close button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Gradient Section - Matching home screen style */}
        <LinearGradient
          colors={['#FFD700', '#FFEB3B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientSection}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="warning" size={64} color="#FF9800" />
            </View>
          </View>
          
          <Text style={styles.title}>
            Payment Notice
          </Text>
          
          <Text style={styles.subtitle}>
            You have unpaid fees
          </Text>
        </LinearGradient>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconWrapper}>
                <Ionicons name="information-circle" size={28} color="#01CBCA" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>
                  Unpaid Fees Count
                </Text>
                <Text style={styles.infoCount}>
                  {count} {count === 1 ? 'payment' : 'payments'}
                </Text>
              </View>
            </View>
          </View>

          {/* Message Card */}
          <View style={styles.messageCard}>
            <Ionicons name="alert-circle-outline" size={20} color="#666666" style={styles.messageIcon} />
            <Text style={styles.messageText}>
              Please complete your payments to access all features of the application.
            </Text>
          </View>

          {/* Payment Button */}
          <TouchableOpacity 
            style={styles.paymentButton}
            onPress={handleGoToPayments}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#01CBCA', '#00A8A8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="wallet" size={24} color="#FFFFFF" />
              <Text style={styles.paymentButtonText}>
                Go to Payments
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Close Button */}
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>
              Later
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createShadowStyle = (nativeShadow: Record<string, any>, webShadow: string) =>
  Platform.OS === 'web' ? { boxShadow: webShadow } : nativeShadow;

const createTextShadowStyle = (nativeShadow: Record<string, any>, webShadow: string) =>
  Platform.OS === 'web' ? { textShadow: webShadow } : nativeShadow;

const closeButtonShadow = createShadowStyle(
  {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  '0px 4px 12px rgba(0, 0, 0, 0.08)'
);

const iconCircleShadow = createShadowStyle(
  {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  '0px 12px 24px rgba(0, 0, 0, 0.12)'
);

const infoCardShadow = createShadowStyle(
  {
    shadowColor: '#01CBCA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  '0px 12px 24px rgba(1, 203, 202, 0.25)'
);

const iconWrapperShadow = createShadowStyle(
  {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  '0px 8px 18px rgba(0, 0, 0, 0.1)'
);

const paymentButtonShadow = createShadowStyle(
  {
    shadowColor: '#01CBCA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  '0px 16px 32px rgba(1, 203, 202, 0.35)'
);

const titleTextShadow = createTextShadowStyle(
  {
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  '0px 2px 4px rgba(0, 0, 0, 0.1)'
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    ...closeButtonShadow,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gradientSection: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...iconCircleShadow,
  },
  title: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 32,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    ...titleTextShadow,
  },
  subtitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    opacity: 0.8,
  },
  contentSection: {
    padding: 20,
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#E0F7FA',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#01CBCA',
    ...infoCardShadow,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    ...iconWrapperShadow,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCount: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 28,
    color: '#01CBCA',
  },
  messageCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  messageText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    flex: 1,
  },
  paymentButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 16,
    ...paymentButtonShadow,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
    gap: 12,
  },
  paymentButtonText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 16,
    color: '#666666',
  },
  loadingText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 50,
  },
});