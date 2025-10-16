import { paymentApi } from '@/lib/payment/payment.api';
import {
  QrResponse,
  TransactionDetail,
  TransactionStatus,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
} from '@/lib/payment/payment.type';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [qrCode, setQrCode] = useState<QrResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingQr, setLoadingQr] = useState(false);
  const [savingQr, setSavingQr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qrCodeRef = useRef<View>(null);

  const loadTransactionDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentApi.getTransactionDetail(id);
      setTransaction(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to load transaction details');
      console.error('Load transaction detail error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleGenerateQr = async () => {
    if (!id) return;
    
    try {
      setLoadingQr(true);
      const qr = await paymentApi.generateQrCode(id);
      setQrCode(qr);
    } catch (err: any) {
      Alert.alert(
        'Error', 
        err.response?.data?.message || err.message || 'Unable to generate QR code'
      );
      console.error('Generate QR error:', err);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleOpenCheckoutUrl = () => {
    if (qrCode?.checkoutUrl) {
      Linking.openURL(qrCode.checkoutUrl).catch(() => {
        Alert.alert('Error', 'Unable to open payment link');
      });
    }
  };

  const handleRefresh = () => {
    loadTransactionDetail();
    setQrCode(null);
  };

  const handleSaveQrCode = async () => {
    if (!qrCodeRef.current) {
      Alert.alert('Error', 'QR Code not available');
      return;
    }

    try {
      setSavingQr(true);

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to save images to your photo library'
        );
        return;
      }

      // Capture QR code as image
      const uri = await captureRef(qrCodeRef, {
        format: 'png',
        quality: 1,
      });

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('EduBus Payments', asset, false);

      Alert.alert(
        'Success! ✅',
        'QR code saved to your photo library. You can now open it in your banking app to scan.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Save QR error:', error);
      Alert.alert(
        'Error',
        'Unable to save QR code. Please try again or take a screenshot instead.'
      );
    } finally {
      setSavingQr(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadTransactionDetail();
    }
  }, [id, loadTransactionDetail]);

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
        <Text style={styles.errorText}>
          {error || 'Transaction not found'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
          onPress={() => router.back()} 
          style={styles.backIconButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Payment Details</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Transaction Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="receipt" size={24} color="#01CBCA" style={{ marginRight: 10 }} />
                <Text style={styles.cardTitle}>Transaction Information</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(transaction.status) }
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
              <Text style={styles.infoValue}>{transaction.transactionCode}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>{formatDate(transaction.createdAt)}</Text>
            </View>

            {transaction.paidAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Paid:</Text>
                <Text style={styles.infoValue}>{formatDate(transaction.paidAt)}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="card" size={20} color="#01CBCA" style={{ marginRight: 8 }} />
                <Text style={styles.totalLabel}>Total Amount</Text>
              </View>
              <Text style={styles.totalAmount}>
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          </View>

          {/* Transport Fee Items */}
          {transaction.transportFeeItems && transaction.transportFeeItems.length > 0 && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="list" size={24} color="#01CBCA" style={{ marginRight: 10 }} />
                <Text style={styles.cardTitle}>Fee Details</Text>
              </View>
              
              {transaction.transportFeeItems.map((item, index) => (
                <View 
                  key={item.id}
                  style={[
                    styles.feeItem,
                    index > 0 && styles.feeItemBorder
                  ]}
                >
                  <View style={styles.feeItemHeader}>
                    <Ionicons name="person" size={16} color="#01CBCA" />
                    <Text style={styles.studentName}>{item.studentName}</Text>
                  </View>
                  
                  <Text style={styles.feeDescription}>{item.description}</Text>
                  
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
                  
                  <Text style={styles.feeAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Payment Action Card */}
          {transaction.status === TransactionStatus.Notyet && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="wallet" size={24} color="#01CBCA" style={{ marginRight: 10 }} />
                <Text style={styles.cardTitle}>Payment</Text>
              </View>

              {!qrCode ? (
                <>
                  <Text style={styles.paymentInstruction}>
                    Click the button below to generate a PayOS payment QR code
                  </Text>
                  <TouchableOpacity
                    onPress={handleGenerateQr}
                    disabled={loadingQr}
                    style={[
                      styles.generateQrButton,
                      loadingQr && styles.buttonDisabled
                    ]}
                  >
                    {loadingQr ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Generate Payment QR Code</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View>
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
                  
                  <Text style={styles.qrExpiry}>
                    QR code valid until {formatDate(qrCode.expiresAt)}
                  </Text>

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
                    style={[styles.saveQrButton, savingQr && styles.buttonDisabled]}
                  >
                    {savingQr ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Save QR Code to Gallery</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleGenerateQr}
                    disabled={loadingQr}
                    style={styles.regenerateButton}
                  >
                    <Text style={styles.regenerateButtonText}>
                      Generate New QR Code
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Already Paid Message */}
          {transaction.status === TransactionStatus.Paid && (
            <View style={styles.paidCard}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={styles.paidTitle}>Payment Completed</Text>
              <Text style={styles.paidMessage}>
                This transaction has been paid successfully
              </Text>
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
    backgroundColor: '#F8FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    padding: 20,
  },
  header: {
    backgroundColor: '#01CBCA',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#01CBCA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backIconButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#1A1A1A',
    letterSpacing: 0.3,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'RobotoSlab-Bold',
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 20,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EAED',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 15,
    color: '#6B7280',
  },
  infoValue: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 15,
    color: '#1A1A1A',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  totalLabel: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 18,
    color: '#1A1A1A',
  },
  totalAmount: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 24,
    color: '#01CBCA',
    letterSpacing: 0.5,
  },
  feeItem: {
    paddingVertical: 16,
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  feeItemBorder: {
    marginTop: 8,
  },
  feeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentName: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
  },
  feeDescription: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  feeDetails: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  feeDetailText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#4A5568',
    marginBottom: 6,
    lineHeight: 20,
  },
  feeAmount: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 18,
    color: '#01CBCA',
    textAlign: 'right',
    marginTop: 4,
  },
  paymentInstruction: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  generateQrButton: {
    backgroundColor: '#01CBCA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#01CBCA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveQrButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  regenerateButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  regenerateButtonText: {
    color: '#4B5563',
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  qrInstruction: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 15,
    color: '#4A5568',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#01CBCA',
    shadowColor: '#01CBCA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  qrCodeImage: {
    width: 240,
    height: 240,
    borderRadius: 12,
  },
  qrExpiry: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  paidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  paidTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 24,
    color: '#10B981',
    marginTop: 16,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  paidMessage: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 20,
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#01CBCA',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#01CBCA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
