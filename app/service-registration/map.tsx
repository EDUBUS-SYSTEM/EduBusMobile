import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { pickupPointApi } from '@/lib/parent/pickupPoint.api';
import { childrenApi } from '@/lib/parent/children.api';
import { authApi } from '@/lib/auth/auth.api';
import { apiService } from '@/lib/api';
import { API_CONFIG } from '@/constants/ApiConfig';
import type { Child } from '@/lib/parent/children.type';

interface Student {
  id?: string;
  fullName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

interface SemesterFeeInfo {
  totalFee: number;
  semesterInfo: {
    name: string;
    academicYear: string;
    totalSchoolDays: number;
    totalTrips: number;
  };
}

const SCHOOL_LOCATION = {
  lat: 15.9796,
  lng: 108.2605,
};

function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

export default function MapScreen() {
  const [parentEmail, setParentEmail] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [fare, setFare] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(7000);
  const [semesterFeeInfo, setSemesterFeeInfo] = useState<SemesterFeeInfo | null>(null);
  const [semesterFeeLoading, setSemesterFeeLoading] = useState(false);
  const [semesterFeeError, setSemesterFeeError] = useState('');
  const webViewRef = useRef<WebView>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Get parent email from storage (set in student selection)
        const email = await AsyncStorage.getItem('parentEmail');
        if (!email) {
          setError('Parent email not found. Please go back and try again.');
          return;
        }
        setParentEmail(email);

        // Get selected students
        const selectedStudentIdsJson = await AsyncStorage.getItem('selectedStudents');
        if (!selectedStudentIdsJson) {
          setError('Selected students not found. Please go back and try again.');
          return;
        }

        const selectedStudentIds: string[] = JSON.parse(selectedStudentIdsJson);

        // Get user info to get parent ID
        const userInfo = await authApi.getUserInfo();
        if (!userInfo.userId) {
          setError('Unable to get user information. Please login again.');
          return;
        }

        // Get all children
        const childrenData = await childrenApi.getChildrenByParent(userInfo.userId);

        // Filter only selected students
        const filteredStudents = childrenData.filter((child: Child) =>
          selectedStudentIds.includes(child.id)
        );

        // Convert to Student format
        const studentsData: Student[] = filteredStudents.map((child: Child) => ({
          id: child.id,
          fullName: `${child.firstName} ${child.lastName}`,
          name: `${child.firstName} ${child.lastName}`,
          firstName: child.firstName,
          lastName: child.lastName,
        }));

        setStudents(studentsData);

        // Load unit price
        try {
          const unitPriceData = await pickupPointApi.getCurrentUnitPrice();
          setUnitPrice(unitPriceData.pricePerKm);
        } catch (err) {
          console.error('Error loading unit price:', err);
          // Use default
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(
          err.response?.data?.message || err.message || 'Failed to load data. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate semester fee
  const calculateSemesterFee = async (distanceKm: number) => {
    if (!distanceKm || distanceKm <= 0) return;

    try {
      setSemesterFeeLoading(true);
      setSemesterFeeError('');

      const data = await pickupPointApi.calculateSemesterFee(distanceKm);
      setSemesterFeeInfo(data);
    } catch (error: any) {
      console.error('Error calculating semester fee:', error);
      setSemesterFeeError('Unable to calculate semester fee. Please try again.');
    } finally {
      setSemesterFeeLoading(false);
    }
  };

  // Handle location selection from WebView
  const handleLocationSelected = (coords: { lat: number; lng: number }, address: string) => {
    setSelectedCoords(coords);
    setSearchQuery(address || 'Selected location');

    // Calculate distance
    const distanceKm = calculateDistance(SCHOOL_LOCATION, coords);
    setDistance(`${distanceKm.toFixed(2)} km`);

    // Estimate duration (rough: 2 minutes per km)
    const minutes = Math.round(distanceKm * 2);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    setDuration(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);

    // Calculate fare
    const fareNumber = distanceKm * unitPrice;
    const formattedFare = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Math.round(fareNumber));
    setFare(formattedFare);

    // Calculate semester fee
    calculateSemesterFee(distanceKm);

    setShowSubmitForm(true);
  };

  // Handle WebView messages
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOCATION_SELECTED') {
        handleLocationSelected(
          { lat: data.lat, lng: data.lng },
          data.address || 'Selected location'
        );
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Submit request
  const handleSubmitRequest = async () => {
    if (!selectedCoords || !parentEmail || students.length === 0) {
      Alert.alert('Error', 'Please select a location and ensure students are loaded.');
      return;
    }

    if (!distance || parseFloat(distance.replace(' km', '')) <= 0) {
      Alert.alert('Error', 'Please ensure distance is calculated correctly.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const distanceKm = parseFloat(distance.replace(' km', '')) || 0;

      const payload = {
        email: parentEmail,
        studentIds: students.map((s) => s.id?.toString() || ''),
        addressText: searchQuery || 'Selected location',
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        distanceKm: distanceKm,
        description: `Pickup point request for ${students.length} student(s)`,
        reason: 'Parent requested pickup point service',
      };

      const result = await pickupPointApi.submitRequest(payload);
      setSubmitSuccess(result.message || 'Request submitted successfully!');

      // Clear form and navigate back after success
      setTimeout(() => {
        router.replace('/(parent-tabs)/home');
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setSubmitError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to submit request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate HTML for WebView with simple map interface
  // Note: For production, replace YOUR_API_KEY with actual VietMap API key
  const generateMapHTML = () => {
    // In production, you should get the API key from environment variables
    const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || 'YOUR_API_KEY_HERE';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    #map { width: 100%; height: 100vh; }
    .info-panel {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      max-width: 400px;
    }
    .button {
      background: #FDC700;
      color: black;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
    }
    .button:hover {
      background: #FBD748;
    }
    .error {
      color: red;
      font-size: 12px;
      margin-top: 10px;
    }
  </style>
  <script src="https://maps.vietmap.vn/api/maps/vietmapgl.js?apikey=${apiKey}"></script>
  <link href="https://maps.vietmap.vn/api/maps/vietmapgl.css?apikey=${apiKey}" rel="stylesheet">
</head>
<body>
  <div id="map"></div>
  <div class="info-panel">
    <p><strong>School Location:</strong> FPT School Đà Nẵng</p>
    <p style="font-size: 12px; color: #666;">Click on the map to select your home location</p>
    <button class="button" onclick="getCurrentLocation()">📍 Get My Location</button>
    <div id="error" class="error"></div>
  </div>
  <script>
    const schoolLocation = [108.2605, 15.9796];
    let map;
    let marker = null;
    const apiKey = '${apiKey}';
    
    function showError(msg) {
      const errorDiv = document.getElementById('error');
      if (errorDiv) {
        errorDiv.textContent = msg;
      }
    }
    
    function initMap() {
      if (apiKey === 'YOUR_API_KEY_HERE') {
        showError('⚠️ VietMap API key not configured. Please set EXPO_PUBLIC_VIETMAP_API_KEY in your .env file.');
        return;
      }
      
      try {
        map = new vietmapgl.Map({
          container: 'map',
          style: 'https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=' + apiKey,
          center: schoolLocation,
          zoom: 14
        });
        
        map.on('load', () => {
          // Add school marker
          new vietmapgl.Marker({ color: 'red' })
            .setLngLat(schoolLocation)
            .setPopup(new vietmapgl.Popup().setHTML('<b>FPT School Đà Nẵng</b>'))
            .addTo(map);
        });
        
        // Handle map click
        map.on('click', (e) => {
          const coords = e.lngLat;
          
          if (marker) marker.remove();
          
          marker = new vietmapgl.Marker({ color: '#FDC700' })
            .setLngLat(coords)
            .setPopup(new vietmapgl.Popup().setHTML('<b>Selected Location</b>'))
            .addTo(map);
          
          // Send location to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'LOCATION_SELECTED',
              lat: coords.lat,
              lng: coords.lng,
              address: 'Selected location'
            }));
          }
        });
      } catch (error) {
        showError('Error loading map: ' + error.message);
        console.error('Map initialization error:', error);
      }
    }
    
    function getCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = [position.coords.longitude, position.coords.latitude];
            if (map) {
              map.flyTo({ center: coords, zoom: 15 });
              
              if (marker) marker.remove();
              
              marker = new vietmapgl.Marker({ color: '#FDC700' })
                .setLngLat(coords)
                .setPopup(new vietmapgl.Popup().setHTML('<b>My Location</b>'))
                .addTo(map);
              
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'LOCATION_SELECTED',
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  address: 'My Current Location'
                }));
              }
            }
          },
          (error) => {
            showError('Unable to get location: ' + error.message);
          }
        );
      } else {
        showError('Geolocation is not supported.');
      }
    }
    
    // Initialize map when page loads
    if (typeof vietmapgl !== 'undefined') {
      initMap();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          if (typeof vietmapgl !== 'undefined') {
            initMap();
          } else {
            showError('Failed to load VietMap library. Please check your API key.');
          }
        }, 1000);
      });
    }
  </script>
</body>
</html>
    `;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FDC700" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#000000' }}>Loading map...</Text>
      </View>
    );
  }

  if (error && !parentEmail) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF5350" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FEFCE8', '#FFF085']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find Route</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      {!showSubmitForm ? (
        <>
          {/* Map Container */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <View style={styles.webMapContainer}>
                <Text style={styles.webMapText}>
                  Map functionality is available when running on web browser.{'\n'}
                  Please use 'npm start' or 'expo start --web' to view the map.
                </Text>
                <Text style={styles.webMapText}>
                  For now, you can manually enter coordinates or use a simple map interface.
                </Text>
              </View>
            ) : (
              <WebView
                ref={webViewRef}
                source={{ html: generateMapHTML() }}
                style={styles.webview}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FDC700" />
                  </View>
                )}
              />
            )}
          </View>

          {/* Info Panel */}
          {selectedCoords && (
            <View style={styles.infoPanel}>
              <Text style={styles.infoTitle}>Selected Location</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Distance:</Text>
                <Text style={styles.infoValue}>{distance || 'Calculating...'}</Text>
              </View>
              {duration && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Duration:</Text>
                  <Text style={styles.infoValue}>{duration}</Text>
                </View>
              )}
              {fare && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fare (per trip):</Text>
                  <Text style={styles.infoValue}>{fare}</Text>
                </View>
              )}
              {semesterFeeInfo && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Semester Total:</Text>
                  <Text style={styles.infoValue}>
                    {semesterFeeInfo.totalFee.toLocaleString('vi-VN')}₫
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => handleLocationSelected(selectedCoords, searchQuery)}
                style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.submitForm}>
            <Text style={styles.formTitle}>Submit Pickup Point Request</Text>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Parent Email:</Text>
              <Text style={styles.formValue}>{parentEmail}</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Location:</Text>
              <Text style={styles.formValue}>{searchQuery || 'Selected location'}</Text>
            </View>

            {selectedCoords && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Coordinates:</Text>
                <Text style={styles.formValue}>
                  {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                </Text>
              </View>
            )}

            {distance && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Distance:</Text>
                <Text style={styles.formValue}>{distance}</Text>
              </View>
            )}

            {duration && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Duration:</Text>
                <Text style={styles.formValue}>{duration}</Text>
              </View>
            )}

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Students:</Text>
              <Text style={styles.formValue}>{students.length} student(s)</Text>
              {students.map((s, idx) => (
                <Text key={s.id || idx} style={styles.studentItem}>
                  • {s.fullName || s.name || 'Student'}
                </Text>
              ))}
            </View>

            {fare && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Per Trip Cost:</Text>
                <Text style={styles.formValue}>{fare}</Text>
              </View>
            )}

            {semesterFeeInfo && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Semester Total:</Text>
                <Text style={styles.formValue}>
                  {semesterFeeInfo.totalFee.toLocaleString('vi-VN')}₫
                </Text>
              </View>
            )}

            {submitError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{submitError}</Text>
              </View>
            )}

            {submitSuccess && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{submitSuccess}</Text>
                <Text style={styles.successSubtext}>Redirecting to home page...</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setShowSubmitForm(false)}
                style={[styles.button, styles.cancelButton]}>
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitRequest}
                disabled={isSubmitting}
                style={[styles.button, styles.submitButton, isSubmitting && styles.disabledButton]}>
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backIcon: {
    padding: 10,
  },
  headerTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#000000',
  },
  mapContainer: {
    flex: 1,
    height: 400,
  },
  webview: {
    flex: 1,
  },
  webMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webMapText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  infoPanel: {
    backgroundColor: '#FEFCE8',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderTopColor: '#FDC700',
  },
  infoTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  confirmButton: {
    backgroundColor: '#FDC700',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmButtonText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  submitForm: {
    padding: 20,
  },
  formTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 22,
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  formLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  formValue: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
    color: '#000000',
  },
  studentItem: {
    fontSize: 14,
    color: '#000000',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#666666',
  },
  submitButton: {
    backgroundColor: '#FDC700',
  },
  submitButtonText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#000000',
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontFamily: 'RobotoSlab-Bold',
  },
  successSubtext: {
    color: '#2E7D32',
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    backgroundColor: '#FDC700',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#000000',
  },
});

