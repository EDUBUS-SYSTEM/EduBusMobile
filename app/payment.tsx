import { usePayment } from "@/hooks/useRegistration";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get('window');

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const registrationId = params.registrationId as string;
  const amount = params.amount as string;
  const description = params.description as string;

  const { createPayment, loading, error } = usePayment();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    initializePayment();
  }, [initializePayment]);

  const initializePayment = useCallback(async () => {
    try {
      setIsProcessing(true);
      const paymentRequest = await createPayment(registrationId);
      
      // Mock PayOS URL - thay thế bằng PayOS integration thật
      const mockPayOSUrl = `https://payos.vn/pay/${paymentRequest.payosData.orderCode}?amount=${paymentRequest.amount}&description=${encodeURIComponent(paymentRequest.description)}`;
      setPaymentUrl(mockPayOSUrl);
    } catch (err) {
      console.error("Error initializing payment:", err);
      Alert.alert("Error", "Cannot initialize payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [createPayment, registrationId]);

  const handleBack = () => {
    Alert.alert(
      "Cancel Payment",
      "Are you sure you want to cancel the payment?",
      [
        { text: "Continue Payment", style: "cancel" },
        { 
          text: "Cancel", 
          style: "destructive",
          onPress: () => router.back()
        },
      ]
    );
  };

  const handlePayNow = async () => {
    if (!paymentUrl) {
      Alert.alert("Error", "Cannot create payment link");
      return;
    }

    try {
      // Mở PayOS payment URL
      const supported = await Linking.canOpenURL(paymentUrl);
      if (supported) {
        await Linking.openURL(paymentUrl);
        
        // Show success message (trong thực tế sẽ handle redirect từ PayOS)
        setTimeout(() => {
        Alert.alert(
          "Payment Successful!",
          "Student transportation service has been activated. You can now view your children's information.",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate to children list
                router.replace("/(parent-tabs)/children-list");
              },
            },
          ]
        );
        }, 2000);
      } else {
        Alert.alert("Error", "Cannot open payment application");
      }
    } catch (error) {
      console.error("Error opening payment URL:", error);
      Alert.alert("Error", "Cannot open payment link");
    }
  };

  const handleRetry = () => {
    initializePayment();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header - Smaller */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section - White background with larger logo */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image
                source={require("../assets/images/edubus_logo.png")}
                style={styles.logo}
              />
            </View>
            <Text style={styles.heroTitle}>Payment Service</Text>
            <Text style={styles.heroSubtitle}>EduBus - Safe Student Transportation</Text>
          </View>
        </View>

        {/* Payment Summary Card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="receipt" size={28} color="#01CBCA" />
              </View>
              <Text style={styles.summaryTitle}>Payment Summary</Text>
            </View>
            
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service:</Text>
                <Text style={styles.summaryValue}>{description}</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Method:</Text>
                <View style={styles.payosBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                  <Text style={styles.payosText}>PayOS</Text>
                </View>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.amountValue}>{parseInt(amount).toLocaleString()}</Text>
                  <Text style={styles.currencyText}>VND</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Payment Methods Card */}
        <View style={styles.methodsCard}>
          <View style={styles.methodsHeader}>
            <View style={styles.methodsIconContainer}>
              <Ionicons name="wallet" size={28} color="#01CBCA" />
            </View>
            <Text style={styles.methodsTitle}>Payment Methods</Text>
          </View>
          
          <View style={styles.methodsContent}>
            <View style={styles.paymentMethod}>
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.methodGradient}
              >
                <Ionicons name="card" size={32} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>Credit/Debit Card</Text>
                <Text style={styles.paymentMethodDesc}>Visa, Mastercard, JCB</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
            
            <View style={styles.paymentMethod}>
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.methodGradient}
              >
                <Ionicons name="phone-portrait" size={32} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>E-Wallet</Text>
                <Text style={styles.paymentMethodDesc}>MoMo, ZaloPay, VNPay</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
            </View>
            
            <View style={styles.paymentMethod}>
              <LinearGradient
                colors={['#FF9800', '#F57C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.methodGradient}
              >
                <Ionicons name="business" size={32} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>Bank Transfer</Text>
                <Text style={styles.paymentMethodDesc}>Internet Banking, ATM</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#FF9800" />
            </View>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityCard}>
          <LinearGradient
            colors={['#E8F5E8', '#F1F8E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.securityGradient}
          >
            <View style={styles.securityIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            </View>
            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>Absolute Security</Text>
              <Text style={styles.securityText}>
                Transaction secured by PayOS. Your payment information is encrypted and protected.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color="#FF5722" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pay Now Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.payButton,
              (loading || isProcessing || !paymentUrl) && styles.payButtonDisabled
            ]}
            onPress={handlePayNow}
            disabled={loading || isProcessing || !paymentUrl}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payButtonGradient}
            >
              {loading || isProcessing ? (
                <>
                  <Ionicons name="hourglass" size={28} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>
                    {isProcessing ? "Initializing..." : "Loading..."}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="card" size={28} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Payment Progress Indicator */}
          {(loading || isProcessing) && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#FFF8CF', '#F5E6A3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressFill}
                />
              </View>
              <Text style={styles.progressText}>Processing payment...</Text>
            </View>
          )}
        </View>

        {/* Payment Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Notes:</Text>
          <Text style={styles.tipsText}>
            • Service will be activated immediately after successful payment
          </Text>
          <Text style={styles.tipsText}>
            • You will receive a payment confirmation email
          </Text>
          <Text style={styles.tipsText}>
            • If you have any issues, please contact hotline: 1900-xxxx
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // White background
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18, // Smaller header
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    marginHorizontal: -20,
    paddingVertical: 30, // Smaller padding
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#FFFFFF", // White background
  },
  logoContainer: {
    alignItems: "center",
  },
  logoBackground: {
    width: 120, // Larger logo background
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF8CF", // Card color
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 100, // Larger logo
    height: 80,
    resizeMode: "contain",
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Regular",
    color: "rgba(0, 0, 0, 0.7)",
    textAlign: "center",
  },
  summaryCard: {
    marginBottom: 25,
    borderRadius: 20,
    backgroundColor: "#FFF8CF", // Card color
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  summaryGradient: {
    borderRadius: 20,
    padding: 0,
    backgroundColor: "#FFF8CF", // Card color
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 25,
    paddingBottom: 15,
  },
  summaryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 248, 207, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
  },
  summaryContent: {
    padding: 25,
    paddingTop: 0,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Medium",
    color: "#666666",
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Regular",
    color: "#000000",
    flex: 1,
    textAlign: "right",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 15,
  },
  payosBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  payosText: {
    fontSize: 14,
    fontFamily: "RobotoSlab-Medium",
    color: "#4CAF50",
    marginLeft: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  amountValue: {
    fontSize: 24,
    fontFamily: "RobotoSlab-Bold",
    color: "#4CAF50",
  },
  currencyText: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Medium",
    color: "#4CAF50",
    marginLeft: 5,
  },
  methodsCard: {
    marginBottom: 25,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  methodsHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 25,
    paddingBottom: 15,
  },
  methodsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 248, 207, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  methodsTitle: {
    fontSize: 20,
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
  },
  methodsContent: {
    padding: 25,
    paddingTop: 0,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "transparent",
  },
  methodGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
    marginBottom: 4,
  },
  paymentMethodDesc: {
    fontSize: 14,
    fontFamily: "RobotoSlab-Regular",
    color: "#666666",
  },
  securityCard: {
    marginBottom: 25,
    borderRadius: 15,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  securityGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 15,
  },
  securityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  securityText: {
    fontSize: 14,
    fontFamily: "RobotoSlab-Regular",
    color: "#4CAF50",
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: "#FFEBEE",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "RobotoSlab-Regular",
    color: "#FF5722",
    textAlign: "center",
    marginVertical: 10,
  },
  retryButton: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
  },
  retryButtonText: {
    color: "#000000",
    fontFamily: "RobotoSlab-Medium",
    fontSize: 14,
  },
  buttonContainer: {
    marginBottom: 25,
  },
  payButton: {
    marginBottom: 15,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 30,
    backgroundColor: "#FCCF08", // Button color
    shadowColor: "#FCCF08",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  payButtonText: {
    color: "#000000",
    fontFamily: "RobotoSlab-Bold",
    fontSize: 20,
    marginLeft: 12,
  },
  progressContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  progressBar: {
    width: width * 0.6,
    height: 4,
    backgroundColor: "rgba(1, 203, 202, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    width: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontFamily: "RobotoSlab-Regular",
    color: "#D4A574",
  },
  tipsCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: "RobotoSlab-Bold",
    color: "#F57C00",
    marginBottom: 15,
  },
  tipsText: {
    fontSize: 14,
    fontFamily: "RobotoSlab-Regular",
    color: "#F57C00",
    marginBottom: 8,
    lineHeight: 22,
  },
});
