import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const VIETMAP_API_KEY = '5d4d861e46189cd0343bf7e852114b56ca746492a59dbd47';
const SCHOOL_LOCATION = { lat: 16.0544, lng: 108.2022 }; // Da Nang

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (data: {
    address: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
  }) => void;
}

export default function LocationPicker({ visible, onClose, onLocationSelected }: LocationPickerProps) {
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const webViewRef = useRef<WebView>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        setSelectedLocation({
          lat: data.lat,
          lng: data.lng,
          address: data.address || 'Selected location',
        });
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('No location selected', 'Please tap on the map to select a location');
      return;
    }

    const distanceKm = calculateDistance(
      selectedLocation.lat,
      selectedLocation.lng,
      SCHOOL_LOCATION.lat,
      SCHOOL_LOCATION.lng
    );

    onLocationSelected({
      address: selectedLocation.address,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
    });

    setSelectedLocation(null);
    onClose();
  };

  const handleCancel = () => {
    setSelectedLocation(null);
    onClose();
  };

  if (!visible) {
    return null;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    #map { width: 100%; height: 100vh; }
  </style>
  <script src="https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.js"></script>
  <link href="https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.css" rel="stylesheet">
</head>
<body>
  <div id="map"></div>
  <script>
    const schoolLocation = [${SCHOOL_LOCATION.lng}, ${SCHOOL_LOCATION.lat}];
    let map;
    let marker = null;
    let schoolMarker = null;
    const apiKey = '${VIETMAP_API_KEY}';

    function initMap() {
      try {
        map = new vietmapgl.Map({
          container: 'map',
          style: 'https://maps.vietmap.vn/api/maps/light/styles.json?apikey=' + apiKey,
          center: schoolLocation,
          zoom: 13
        });

        // Add school marker
        schoolMarker = new vietmapgl.Marker({ color: '#4CAF50' })
          .setLngLat(schoolLocation)
          .setPopup(new vietmapgl.Popup().setHTML('<b>School</b>'))
          .addTo(map);

        // Handle map clicks
        map.on('click', async function(e) {
          const coords = e.lngLat;
          
          if (marker) marker.remove();
          
          marker = new vietmapgl.Marker({ color: '#F44336' })
            .setLngLat([coords.lng, coords.lat])
            .setPopup(new vietmapgl.Popup().setHTML('<b>Selected location</b><br>Getting address...'))
            .addTo(map);
          
          marker.togglePopup();

          // Reverse geocode to get address
          try {
            const response = await fetch('https://maps.vietmap.vn/api/reverse/v3?apikey=' + apiKey + '&lng=' + coords.lng + '&lat=' + coords.lat);
            const data = await response.json();
            let address = 'Selected location';
            
            if (data && data.length > 0) {
              address = data[0].display || data[0].name || address;
            }

            // Update popup with address
            if (marker) {
              marker.setPopup(new vietmapgl.Popup().setHTML('<b>Selected location</b><br>' + address));
              marker.togglePopup();
            }

            // Send to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                lat: coords.lat,
                lng: coords.lng,
                address: address
              }));
            }
          } catch (error) {
            console.error('Reverse geocode error:', error);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                lat: coords.lat,
                lng: coords.lng,
                address: coords.lat.toFixed(6) + ', ' + coords.lng.toFixed(6)
              }));
            }
          }
        });
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    }

    // Initialize map when VietMap library is loaded
    if (typeof vietmapgl !== 'undefined') {
      initMap();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          if (typeof vietmapgl !== 'undefined') {
            initMap();
          } else {
            console.error('Failed to load VietMap library');
          }
        }, 1000);
      });
    }
  </script>
</body>
</html>
  `;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Ionicons name="information-circle" size={20} color="#01CBCA" />
          <Text style={styles.instructionsText}>Tap on the map to select your new pickup location</Text>
        </View>

        {/* Map WebView */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
            style={styles.webview}
            onMessage={handleMessage}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#01CBCA" />
            </View>
          )}
        </View>

        {/* Selected Location Info */}
        {selectedLocation && (
          <View style={styles.locationInfoContainer}>
            <View style={styles.locationInfoRow}>
              <Ionicons name="location" size={20} color="#01CBCA" />
              <Text style={styles.locationInfoText} numberOfLines={2}>
                {selectedLocation.address}
              </Text>
            </View>
            <View style={styles.locationInfoRow}>
              <Ionicons name="navigate" size={20} color="#666" />
              <Text style={styles.locationInfoText}>
                {calculateDistance(
                  selectedLocation.lat,
                  selectedLocation.lng,
                  SCHOOL_LOCATION.lat,
                  SCHOOL_LOCATION.lng
                ).toFixed(2)}{' '}
                km from school
              </Text>
            </View>
          </View>
        )}

        {/* Confirm Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!selectedLocation}
          >
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFF9C4',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#000',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
  },
  instructionsText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  locationInfoContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  locationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationInfoText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  confirmButton: {
    backgroundColor: '#01CBCA',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#FFF',
  },
});
