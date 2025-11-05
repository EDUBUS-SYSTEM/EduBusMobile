import { usePayment } from '@/hooks/payments/usePayment';
import {
  TransactionStatus,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText
} from "@/lib/payment/payment.type";
import { signalRService } from '@/lib/signalr/signalr.service';
import { updateTransactionDetail } from '@/store/slices/paymentSlice';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from "@react-navigation/native";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";
import { useDispatch } from 'react-redux';
export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useDispatch();
  const {
    transactionDetail: transaction,
    qrCode,
    loadingDetail: loading,
    loadingQr,
    errorDetail: error,
    qrTimeRemaining: timeRemaining,
    loadTransactionDetail,
    generateQr,
    clearQr,
    setQrTimeRemaining,
  } = usePayment();

  const [savingQr, setSavingQr] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const qrCodeRef = useRef<View>(null);
  const previousTransactionId = useRef<string | null>(null);
  const qrExpiryTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (qrExpiryTimerRef.current) {
      clearInterval(qrExpiryTimerRef.current);
      qrExpiryTimerRef.current = null;
    }
    setQrTimeRemaining(0);  
  }, [setQrTimeRemaining]);

  const handleGenerateQr = useCallback(async () => {
    if (!id || !transaction) return;
    
    try {
      // Clear timers directly instead of calling clearTimers()
      if (qrExpiryTimerRef.current) {
        clearInterval(qrExpiryTimerRef.current);
        qrExpiryTimerRef.current = null;
      }
      setQrTimeRemaining(0);
      
      await generateQr(id);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Unable to generate QR code");
    }
  }, [id, transaction, generateQr, setQrTimeRemaining]);

  // Use ref to avoid recreating useEffect when handleGenerateQr changes
  const handleGenerateQrRef = useRef(handleGenerateQr);
  useEffect(() => {
    handleGenerateQrRef.current = handleGenerateQr;
  }, [handleGenerateQr]);
  

  useEffect(() => {
    if (!qrCode?.expiresAt) return;
    
    // Clear existing timer
    if (qrExpiryTimerRef.current) {
      clearInterval(qrExpiryTimerRef.current);
      qrExpiryTimerRef.current = null;
    }
    
    const expiryTime = new Date(qrCode.expiresAt).getTime();
    const now = Date.now();
    const remainingMs = expiryTime - now;
  
    if (remainingMs > 0) {
      setQrTimeRemaining(Math.floor(remainingMs / 1000));
      
      const qrTimer = setInterval(() => {
        const currentTime = Date.now();
        const remaining = Math.floor((expiryTime - currentTime) / 1000);
        
        if (remaining <= 0) {
          clearInterval(qrTimer);
          qrExpiryTimerRef.current = null;
          clearQr();
          // Use ref to avoid dependency on handleGenerateQr
          handleGenerateQrRef.current();
        } else {
          setQrTimeRemaining(remaining);
        }
      }, 1000) as unknown as NodeJS.Timeout;
      
      qrExpiryTimerRef.current = qrTimer;
    }
    
    return () => {
      if (qrExpiryTimerRef.current) {
        clearInterval(qrExpiryTimerRef.current);
        qrExpiryTimerRef.current = null;
      }
    };
  }, [qrCode, clearQr, setQrTimeRemaining]); 


  const handleOpenCheckoutUrl = () => {
    if (qrCode?.checkoutUrl) {
      Linking.openURL(qrCode.checkoutUrl).catch(() => {
        Alert.alert("Error", "Unable to open payment link");
      });
    }
  };

  const handleRefresh = () => {
    // Clear all states using Redux actions
    clearQr();
    setPaymentSuccess(false);
    setQrTimeRemaining(0);  // If you keep this local state
    clearTimers();
  
    //Reload transaction detail using Redux
    loadTransactionDetail(id);
  };

  const handleSaveQrCode = async () => {
    if (!qrCodeRef.current) {
      Alert.alert("Error", "QR Code not available");
      return;
    }

    try {
      setSavingQr(true);

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to save images to your photo library"
        );
        return;
      }

      // Capture QR code as image
      const uri = await captureRef(qrCodeRef, {
        format: "png",
        quality: 1,
      });

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("EduBus Payments", asset, false);

      Alert.alert(
        "Success! ✅",
        "QR code saved to your photo library. You can now open it in your banking app to scan.",
        [{ text: "OK" }]
      );
    } catch (error: any) {
      console.error("Save QR error:", error);
      Alert.alert(
        "Error",
        "Unable to save QR code. Please try again or take a screenshot instead."
      );
    } finally {
      setSavingQr(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadTransactionDetail(id);
    }

    // Cleanup timers on unmount
    return () => {
      clearTimers();
    };
  }, [id]);

  // Listen for real-time payment updates
  useEffect(() => {
    if (!id || !signalRService) return;

    const handlePaymentUpdate = (data: any) => {
      console.log('💰 Real-time payment update received in payment-detail:', data);
      
      // If this is the current transaction, update directly from SignalR data
      // NOTE: Server sends camelCase (transactionId, transaction), not PascalCase
      if (data.transactionId === id && data.transaction) {
        console.log('✅ Updating transaction detail from real-time data');
        console.log('Transaction data:', JSON.stringify(data.transaction, null, 2));
        
        // Transform data: Server sends paidAtUtc, but frontend expects paidAt
        const transformedTransaction = {
          ...data.transaction,
          paidAt: data.transaction.paidAtUtc || data.transaction.paidAt,
          createdAt: data.transaction.createdAtUtc || data.transaction.createdAt,
        };
        
        console.log('📝 Transformed paidAtUtc:', data.transaction.paidAtUtc, '→ paidAt:', transformedTransaction.paidAt);
        
        // Dispatch action to update Redux state directly (no API call needed!)
        dispatch(updateTransactionDetail(transformedTransaction));
      }
    };

    // Wait a bit for SignalR connection if needed
    const subscribeWithRetry = async () => {
      let retries = 0;
      const maxRetries = 10; // Increased to 10 to allow more time for reconnection
      
      while (retries < maxRetries) {
        const state = signalRService.getState();
        console.log(`⏳ SignalR state: ${state} (attempt ${retries + 1}/${maxRetries})`);
        
        // If already connected, subscribe immediately
        if (signalRService.isConnected()) {
          console.log('📡 Subscribing to TransactionStatusUpdated event');
          signalRService.on('TransactionStatusUpdated', handlePaymentUpdate);
          return; // Success!
        }
        
        // If connecting or reconnecting, wait for it to complete
        if (state === 'Reconnecting' || state === 'Connecting') {
          console.log(`⏳ SignalR is ${state}, waiting for connection...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
          continue;
        }
        
        // If disconnected, try to reconnect manually
        if (state === 'Disconnected' || !state) {
          console.log('🔄 SignalR disconnected, attempting to reconnect...');
          try {
            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
              await signalRService.initialize(token);
              console.log('✅ SignalR reconnected successfully');
              continue; // Try to subscribe in the next iteration
            } else {
              console.warn('⚠️ No token found, cannot reconnect SignalR');
              break;
            }
          } catch (error) {
            console.error('❌ Failed to reconnect SignalR:', error);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        // Default wait
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }
      
      console.error('❌ SignalR not connected after retries. Real-time updates will not work.');
      console.log('💡 You can still refresh manually to see payment updates.');
    };

    subscribeWithRetry();

    // Cleanup
    return () => {
      try {
        signalRService.off('TransactionStatusUpdated');
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [id, dispatch]);

  // Clear QR state when transaction ID changes
  useEffect(() => {
    if (previousTransactionId.current !== id) {
      console.log("Clearing QR state for transaction ID:", id);
      clearQr();  
      setPaymentSuccess(false);
      clearTimers();
      previousTransactionId.current = id;
    }
  }, [id]);

  // Auto-generate QR when entering the page for pending transactions
  useFocusEffect(
    useCallback(() => {
      // REMOVED: Auto-generate QR on page load
      // Now QR will only be generated when user clicks the button
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#01CBCA" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error || !transaction) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF9800" />
        <Text style={styles.errorText}>{error || "Transaction not found"}</Text>
         <TouchableOpacity
           onPress={() => router.push("/(parent-tabs)/payments?refresh=true")}
           style={styles.backButton}
         >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(parent-tabs)/payments?refresh=true")}
          style={styles.backIconButton}
        >
          <Ionicons name="arrow-back" size={24} color="#92400E" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Payment Details</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={20} color="#92400E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Transaction Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <Ionicons
                  name="receipt"
                  size={24}
                  color="#01CBCA"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.cardTitle}>Transaction Information</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(transaction.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(transaction.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.description}>{transaction.description}</Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transaction Code:</Text>
              <Text style={styles.infoValue}>
                {transaction.transactionCode}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>
                {formatDate(transaction.createdAt)}
              </Text>
            </View>

            {transaction.paidAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Paid:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(transaction.paidAt)}
                </Text>
              </View>
            )}

            <View style={styles.divider} />
          </View>

          {/* Transport Fee Items */}
          {transaction.transportFeeItems &&
            transaction.transportFeeItems.length > 0 && (
              <View style={styles.card}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons
                    name="list"
                    size={24}
                    color="#01CBCA"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.cardTitle}>Fee Details</Text>
                </View>

                {transaction.transportFeeItems.map((item, index) => (
                  <View
                    key={item.id}
                    style={[styles.feeItem, index > 0 && styles.feeItemBorder]}
                  >
                    <View style={styles.feeItemHeader}>
                      <Ionicons name="person" size={16} color="#01CBCA" />
                      <Text style={styles.studentName}>{item.studentName}</Text>
                    </View>

                    <View style={styles.feeDetails}>
                      <Text style={styles.feeDetailText}>
                        Distance: {item.distanceKm} km
                      </Text>
                      <Text style={styles.feeDetailText}>
                        Unit price: {formatCurrency(item.unitPricePerKm)}/km
                      </Text>
                      <Text style={styles.feeDetailText}>
                        Semester: {item.semesterName}
                      </Text>
                      <Text style={styles.feeDetailText}>
                        Academic Year: {item.academicYear}
                      </Text>
                    </View>

                  </View>
                ))}
                <View style={styles.totalRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="card"
                      size={20}
                      color="#01CBCA"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.totalLabel}>Total Amount</Text>
                  </View>
                  <Text style={styles.totalAmount}>
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              </View>
            )}

          {/* Payment Action Card */}
          {transaction.status === TransactionStatus.Notyet && (
            <View style={styles.card}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons
                  name="wallet"
                  size={24}
                  color="#01CBCA"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.cardTitle}>Payment</Text>
              </View>

              {!qrCode ? (
                <>
                  <Text style={styles.paymentInstruction}>
                    Click the button below to generate a PayOS payment QR code
                    for this transaction
                  </Text>
                  {/* Debug log removed to reduce console spam */}
                  <TouchableOpacity
                    onPress={handleGenerateQr}
                    disabled={loadingQr}
                    style={[
                      styles.generateQrButton,
                      (loadingQr) && styles.buttonDisabled,
                    ]}
                  >
                    {loadingQr ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>
                          Generate Payment QR Code
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View>
                  {/* Debug log removed to reduce console spam */}
                  <Text style={styles.qrInstruction}>
                    Scan the QR code with your banking app to make payment
                  </Text>

                  <View
                    ref={qrCodeRef}
                    style={styles.qrCodeContainer}
                    collapsable={false}
                  >
                    <QRCode
                      value={qrCode.qrCode}
                      size={240}
                      backgroundColor="white"
                      color="black"
                    />
                  </View>

                  <View style={styles.qrExpiryContainer}>
                    <Text style={styles.qrExpiry}>
                      QR code valid until {formatDate(qrCode.expiresAt)}
                    </Text>
                    {timeRemaining > 0 && (
                      <View style={styles.countdownContainer}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#FF9800"
                        />
                        <Text style={styles.countdownText}>
                          Auto-refresh in {Math.floor(timeRemaining / 60)}:
                          {(timeRemaining % 60).toString().padStart(2, "0")}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={handleOpenCheckoutUrl}
                    style={styles.checkoutButton}
                  >
                    <View style={styles.buttonContent}>
                      <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Open Payment Link</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveQrCode}
                    disabled={savingQr}
                    style={[
                      styles.saveQrButton,
                      savingQr && styles.buttonDisabled,
                    ]}
                  >
                    {savingQr ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Ionicons
                          name="download-outline"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.buttonText}>
                          Save QR Code to Gallery
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Payment Success Message */}
          {(transaction.status === TransactionStatus.Paid ||
            paymentSuccess) && (
            <View style={styles.paidCard}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={64} color="#6bcb00" />
              </View>
              <Text style={styles.paidTitle}>Payment Successful!</Text>
              <Text style={styles.paidMessage}>
                Your payment has been processed successfully
              </Text>
              {transaction.paidAt && (
                <Text style={styles.paidDate}>
                  Paid on {formatDate(transaction.paidAt)}
                </Text>
              )}
              <View style={styles.successDetails}>
                <View style={styles.successDetailRow}>
                  <Ionicons name="receipt" size={20} color="#F59E0B" />
                  <Text style={styles.successDetailText}>
                    Transaction Code: {transaction.transactionCode}
                  </Text>
                </View>
                <View style={styles.successDetailRow}>
                  <Ionicons name="card" size={20} color="#F59E0B" />
                  <Text style={styles.successDetailText}>
                    Amount: {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  header: {
    backgroundColor: "#FEF3C7",
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backIconButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "RobotoSlab-Bold",
    fontSize: 28,
    color: "#92400E",
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: "RobotoSlab-Bold",
    fontSize: 20,
    color: "#1A1A1A",
    letterSpacing: 0.3,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "RobotoSlab-Bold",
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: "RobotoSlab-Medium",
    fontSize: 16,
    color: "#4A5568",
    marginBottom: 20,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "#E8EAED",
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  infoLabel: {
    fontFamily: "RobotoSlab-Regular",
    fontSize: 15,
    color: "#6B7280",
  },
  infoValue: {
    fontFamily: "RobotoSlab-Medium",
    fontSize: 15,
    color: "#1A1A1A",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },
  totalLabel: {
    fontFamily: "RobotoSlab-Bold",
    fontSize: 18,
    color: "#1A1A1A",
  },
  totalAmount: {
    fontFamily: "RobotoSlab-Bold",
    fontSize: 20,
    color: "#01CBCA",
    letterSpacing: 0.5,
  },
  feeItem: {
    paddingVertical: 16,
    backgroundColor: "#FAFBFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  feeItemBorder: {
    marginTop: 8,
  },
  feeItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  studentName: {
    fontFamily: "RobotoSlab-Bold",
    fontSize: 16,
    color: "#1A1A1A",
    marginLeft: 8,
    flex: 1,
  },
  feeDescription: {
    fontFamily: "RobotoSlab-Regular",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 20,
  },
  feeDetails: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  feeDetailText: {
    fontFamily: "RobotoSlab-Regular",
    fontSize: 13,
    color: "#4A5568",
    marginBottom: 6,
    lineHeight: 20,
  },
  feeAmount: {
    fontFamily: "RobotoSlab-Bold",
    fontSize: 18,
    color: "#01CBCA",
    textAlign: "right",
    marginTop: 4,
  },
  paymentInstruction: {
    fontFamily: "RobotoSlab-Regular",
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  generateQrButton: {
    backgroundColor: "#F59E0B",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: "80%",
    alignSelf: "center",
  },
  checkoutButton: {
    backgroundColor: "#ffdb1f",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: "70%",
    alignSelf: "center",
  },
  saveQrButton: {
    backgroundColor: "#58cbad",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: "70%",
    alignSelf: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "RobotoSlab-Bold",
    fontSize: 16,
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  qrInstruction: {
    fontFamily: "RobotoSlab-Medium",
    fontSize: 15,
    color: "#4A5568",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  qrCodeContainer: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F59E0B",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qrCodeImage: {
    width: 240,
    height: 240,
    borderRadius: 12,
  },
  qrExpiry: {
    fontFamily: "RobotoSlab-Medium",
    fontSize: 13,
    color: "#92400E",
    textAlign: "center",
    marginBottom: 8,
    backgroundColor: "#fff6b6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  qrExpiryContainer: {
    marginBottom: 20,
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff6b6",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 4,
  },
  countdownText: {
    fontFamily: "RobotoSlab-Bold",
    fontSize: 12,
    color: "#D97706",
    marginLeft: 4,
  },
  paidCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#FEF3C7",
  },
  successIconContainer: {
    marginBottom: 16,
  },
  paidTitle: {
    fontFamily: "RobotoSlab-Bold",
    fontSize: 26,
    color: "#6bcb00",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  paidMessage: {
    fontFamily: "RobotoSlab-Regular",
    fontSize: 16,
    color: "#6bcb00",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  paidDate: {
    fontFamily: "RobotoSlab-Medium",
    fontSize: 14,
    color: "#845d00",
    marginBottom: 20,
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  successDetails: {
    width: "100%",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  successDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  successDetailText: {
    fontFamily: "RobotoSlab-Medium",
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: "RobotoSlab-Medium",
    fontSize: 16,
    color: "#6B7280",
  },
  errorText: {
    marginTop: 20,
    fontFamily: "RobotoSlab-Medium",
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: "#01CBCA",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#01CBCA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontFamily: "RobotoSlab-Bold",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
