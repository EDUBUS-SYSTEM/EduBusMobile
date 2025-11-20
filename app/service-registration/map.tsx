import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { pickupPointApi } from '@/lib/parent/pickupPoint.api';
import { childrenApi } from '@/lib/parent/children.api';
import { authApi } from '@/lib/auth/auth.api';
import { useSchoolInfo } from '@/hooks/useSchoolInfo';
import type { Child } from '@/lib/parent/children.type';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
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

interface VietMapGeocodeResult {
  ref_id: string;
  distance: number;
  address: string;
  name: string;
  display: string;
  boundaries: Array<{
    type: number;
    id: number;
    name: string;
    prefix: string;
    full_name: string;
  }>;
  categories: string[];
  entry_points: Array<{
    ref_id: string;
    name: string;
  }>;
  data_old?: unknown;
  data_new?: unknown;
}

const FALLBACK_SCHOOL_LOCATION = {
  lat: 15.9796,
  lng: 108.2605,
};

const FALLBACK_SCHOOL_NAME = 'FPT School Da Nang';

const sanitizeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Helper function to decode polyline encoded string
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5
    });
  }

  return points;
}

// Get route from VietMap Directions API
async function getRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  apiKey: string
): Promise<{ distance: number; duration: number; coordinates: { lat: number; lng: number }[] } | null> {
  try {
    const baseUrl = 'https://maps.vietmap.vn/api/route';
    const params = new URLSearchParams({
      'api-version': '1.1',
      apikey: apiKey,
      points_encoded: 'true',
      vehicle: 'car'
    });
    
    params.append('point', `${origin.lat},${origin.lng}`);
    params.append('point', `${destination.lat},${destination.lng}`);

    const url = `${baseUrl}?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('VietMap Route API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.code !== 'OK' || !data.paths || data.paths.length === 0) {
      console.error('VietMap Route API error:', data.messages || 'No paths found');
      return null;
    }

    const path = data.paths[0];
    const coordinates = decodePolyline(path.points);

    return {
      distance: path.distance / 1000, // Convert to km
      duration: path.time / 1000, // Convert to seconds
      coordinates
    };
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

export default function MapScreen() {
  const [parentEmail, setParentEmail] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VietMapGeocodeResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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
  const [isRouting, setIsRouting] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const webMapRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const routeSourceRef = useRef<any>(null);
  const handleTempLocationSelectedRef = useRef<((coords: { lat: number; lng: number }, address: string) => Promise<void>) | null>(null);
  const handleMarkerClickRef = useRef<((coords: { lat: number; lng: number }, address: string) => void) | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const { schoolInfo } = useSchoolInfo();

  const schoolLocation = useMemo(() => {
    if (typeof schoolInfo?.latitude === 'number' && typeof schoolInfo?.longitude === 'number') {
      return {
        lat: schoolInfo.latitude,
        lng: schoolInfo.longitude,
      };
    }
    return FALLBACK_SCHOOL_LOCATION;
  }, [schoolInfo?.latitude, schoolInfo?.longitude]);

  const schoolName = useMemo(
    () => schoolInfo?.schoolName?.trim() || FALLBACK_SCHOOL_NAME,
    [schoolInfo?.schoolName]
  );

  const schoolAddress = useMemo(
    () => schoolInfo?.displayAddress?.trim() || schoolInfo?.fullAddress?.trim() || '',
    [schoolInfo?.displayAddress, schoolInfo?.fullAddress]
  );

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
          setIsLoading(false);
          return;
        }
        setParentEmail(email);

        // Get selected students
        const selectedStudentIdsJson = await AsyncStorage.getItem('selectedStudents');
        if (!selectedStudentIdsJson) {
          setError('Selected students not found. Please go back and try again.');
          setIsLoading(false);
          return;
        }

        const selectedStudentIds: string[] = JSON.parse(selectedStudentIdsJson);

        // Get user info to get parent ID
        const userInfo = await authApi.getUserInfo();
        if (!userInfo.userId) {
          setError('Unable to get user information. Please login again.');
          setIsLoading(false);
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

  // VietMap Geocoding API functions
  const geocode = async (query: string, location?: { lat: number; lng: number }): Promise<VietMapGeocodeResult[]> => {
    const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('VietMap API key not configured');
      return [];
    }

    const params = new URLSearchParams({
      apikey: apiKey,
      text: query,
      display_type: '1'
    });

    if (location) {
      params.append('focus', `${location.lat},${location.lng}`);
    }

    try {
      const response = await fetch(`https://maps.vietmap.vn/api/search/v4?${params}`);
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          ref_id: item.ref_id || '',
          distance: item.distance || 0,
          address: item.address || '',
          name: item.name || '',
          display: item.display || '',
          boundaries: item.boundaries || [],
          categories: item.categories || [],
          entry_points: item.entry_points || [],
          data_old: item.data_old || null,
          data_new: item.data_new || null
        }));
      }
      return [];
    } catch (error) {
      console.error('Error geocoding:', error);
      return [];
    }
  };

  const autocomplete = async (query: string, location?: { lat: number; lng: number }): Promise<VietMapGeocodeResult[]> => {
    const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('VietMap API key not configured');
      return [];
    }

    const params = new URLSearchParams({
      apikey: apiKey,
      text: query,
      display_type: '1'
    });

    if (location) {
      params.append('focus', `${location.lat},${location.lng}`);
    }

    try {
      const response = await fetch(`https://maps.vietmap.vn/api/autocomplete/v4?${params}`);
      if (!response.ok) {
        throw new Error(`Autocomplete API error: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          ref_id: item.ref_id || '',
          distance: item.distance || 0,
          address: item.address || '',
          name: item.name || '',
          display: item.display || '',
          boundaries: item.boundaries || [],
          categories: item.categories || [],
          entry_points: item.entry_points || [],
          data_old: item.data_old || null,
          data_new: item.data_new || null
        }));
      }
      return [];
    } catch (error) {
      console.error('Error autocomplete:', error);
      return [];
    }
  };

  const getPlaceDetails = async (ref_id: string): Promise<{ lat: number; lng: number } | null> => {
    const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('VietMap API key not configured');
      return null;
    }

    try {
      const params = new URLSearchParams({
        apikey: apiKey,
        ref_id: ref_id
      });

      const response = await fetch(`https://maps.vietmap.vn/api/place/details?${params}`);
      if (!response.ok) {
        throw new Error(`Place details API error: ${response.status}`);
      }

      const data = await response.json();
      if (data && typeof data === 'object') {
        const coords = data.coordinates || data.coord || data.location || data.geometry?.location;
        if (coords && (coords.lat || coords.latitude) && (coords.lng || coords.longitude)) {
          return {
            lat: coords.lat || coords.latitude,
            lng: coords.lng || coords.longitude
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  };

  // Debounced autocomplete handler
  const autocompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleSearchInputChange = useCallback(async (value: string) => {
    setSearchQuery(value);
    
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }
    
    if (value.trim().length >= 2) {
      autocompleteTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSearching(true);
          const results = await autocomplete(value, schoolLocation);
          setSearchResults(results);
          setShowSearchResults(results.length > 0);
        } catch (error) {
          console.error('Error with autocomplete:', error);
          setSearchResults([]);
          setShowSearchResults(false);
        } finally {
          setIsSearching(false);
        }
      }, 500);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [schoolLocation]);

  // Handle search button click
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setError('');
    setIsSearching(true);
    setShowSearchResults(false);
    
    try {
      const results = await geocode(searchQuery, schoolLocation);
      if (results.length > 0) {
        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        setError('No results found for the search query.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setError(`An error occurred while searching: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, schoolLocation]);

  // Handle temp location selection (when clicking on map)
  const handleTempLocationSelected = useCallback(async (coords: { lat: number; lng: number }, address: string) => {
    setTempCoords(coords);
    setSearchQuery(address || 'Selected location');
    
    const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
    if (!apiKey) {
      setError('VietMap API key not configured');
      return;
    }

    setIsRouting(true);
    setDistance('');
    setDuration('');
    setFare('');

    // Get actual route from VietMap Directions API
    const routeData = await getRoute(coords, schoolLocation, apiKey);
    
    if (routeData) {
      const distanceKm = routeData.distance;
      setDistance(`${distanceKm.toFixed(2)} km`);

      // Calculate duration from route
      const minutes = Math.round(routeData.duration / 60);
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

      // Draw route on map (will be handled by map component)
      if (Platform.OS === 'web' && mapInstanceRef.current) {
        // Use the stored map instance
        const map = mapInstanceRef.current;
        if (map && map._drawRoute) {
          map._drawRoute(routeData.coordinates);
        }
      } else if (webViewRef.current) {
        // Send route data to WebView using injected JavaScript
        const coordinatesJson = JSON.stringify(routeData.coordinates);
        const script = `
          if (window.drawRoute) {
            window.drawRoute(${coordinatesJson});
          }
        `;
        webViewRef.current.injectJavaScript(script);
      }
    } else {
      // Fallback to Haversine distance if API fails
      const R = 6371;
      const dLat = ((schoolLocation.lat - coords.lat) * Math.PI) / 180;
      const dLng = ((schoolLocation.lng - coords.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((coords.lat * Math.PI) / 180) *
          Math.cos((schoolLocation.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;
      
      setDistance(`${distanceKm.toFixed(2)} km (estimated)`);
      const minutes = Math.round(distanceKm * 2);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      setDuration(hours > 0 ? `${hours}h ${mins}m (estimated)` : `${mins}m (estimated)`);
      
      const fareNumber = distanceKm * unitPrice;
      const formattedFare = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(Math.round(fareNumber));
      setFare(formattedFare);
      calculateSemesterFee(distanceKm);
    }

    setIsRouting(false);
  }, [unitPrice, calculateSemesterFee, schoolLocation]);

  // Update ref when callback changes
  useEffect(() => {
    handleTempLocationSelectedRef.current = handleTempLocationSelected;
  }, [handleTempLocationSelected]);

  // Handle search result selection
  const handleSearchResultSelect = useCallback(async (result: VietMapGeocodeResult) => {
    setShowSearchResults(false);
    setError('');
    
    let coords = null;
    
    // Try to get coordinates from entry_points first (most accurate)
    if (result.entry_points && result.entry_points.length > 0 && result.entry_points[0].ref_id) {
      try {
        coords = await getPlaceDetails(result.entry_points[0].ref_id);
      } catch (error) {
        console.error('Error getting coordinates from entry_points:', error);
      }
    }
    
    // Fallback to main ref_id
    if (!coords && result.ref_id) {
      try {
        coords = await getPlaceDetails(result.ref_id);
      } catch (error) {
        console.error('Error getting coordinates from ref_id:', error);
      }
    }
    
    // If still no coordinates, try to extract from data_new or data_old
    if (!coords && result.data_new) {
      try {
        const data = result.data_new as any;
        if (data.coordinates || data.coord || data.location || data.geometry?.location) {
          const coordData = data.coordinates || data.coord || data.location || data.geometry?.location;
          if (coordData.lat !== undefined && coordData.lng !== undefined) {
            coords = { lat: coordData.lat, lng: coordData.lng };
          } else if (coordData.latitude !== undefined && coordData.longitude !== undefined) {
            coords = { lat: coordData.latitude, lng: coordData.longitude };
          }
        }
      } catch (error) {
        console.error('Error extracting coordinates from data_new:', error);
      }
    }
    
    // Try data_old as last resort
    if (!coords && result.data_old) {
      try {
        const data = result.data_old as any;
        if (data.coordinates || data.coord || data.location || data.geometry?.location) {
          const coordData = data.coordinates || data.coord || data.location || data.geometry?.location;
          if (coordData.lat !== undefined && coordData.lng !== undefined) {
            coords = { lat: coordData.lat, lng: coordData.lng };
          } else if (coordData.latitude !== undefined && coordData.longitude !== undefined) {
            coords = { lat: coordData.latitude, lng: coordData.longitude };
          }
        }
      } catch (error) {
        console.error('Error extracting coordinates from data_old:', error);
      }
    }
    
    // Fallback to mock coordinates if needed (should not happen with proper API)
    if (!coords) {
      console.warn('No coordinates found for result:', result);
      coords = {
        lat: 16.0544 + (Math.random() - 0.5) * 0.1,
        lng: 108.2022 + (Math.random() - 0.5) * 0.1
      };
    }
    
    setSearchQuery(result.display);
    setTempCoords(coords);
    
    // Update map position and marker for web platform
    if (Platform.OS === 'web' && mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      if (map && map.flyTo) {
        map.flyTo({ 
          center: [coords.lng, coords.lat], 
          zoom: 15 
        });
        
        // Remove existing marker
        const existingMarker = (map as any)._marker;
        if (existingMarker) {
          existingMarker.remove();
        }
        
        // Add new marker
        const vietmapgl = (window as any).vietmapgl;
        if (vietmapgl) {
          const newMarker = new vietmapgl.Marker({ color: '#FDC700' })
            .setLngLat([coords.lng, coords.lat])
            .setPopup(new vietmapgl.Popup().setHTML(`<b>${result.display}</b><br>Click marker to confirm`))
            .addTo(map);
          newMarker.togglePopup();
          (map as any)._marker = newMarker;
        }
      }
    } else if (webViewRef.current) {
      // Update map position and marker for mobile platform
      const script = `
        (function() {
          if (map && window.vietmapgl) {
            const coords = [${coords.lng}, ${coords.lat}];
            map.flyTo({ center: coords, zoom: 15 });
            
            if (marker) marker.remove();
            clearRoute();
            
            marker = new vietmapgl.Marker({ color: '#FDC700' })
              .setLngLat(coords)
              .setPopup(new vietmapgl.Popup().setHTML('<b>${result.display.replace(/'/g, "\\'")}</b><br>Click marker to confirm'))
              .addTo(map);
            
            marker.togglePopup();
          }
        })();
      `;
      webViewRef.current.injectJavaScript(script);
    }
    
    // Calculate route for selected location
    handleTempLocationSelected(coords, result.display);
  }, [handleTempLocationSelected]);

  // Get user's current location
  const handleGetMyLocation = useCallback(() => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser.');
        return;
      }

      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setTempCoords(userCoords);
          setSearchQuery('My Current Location');
          setIsLoading(false);
          handleTempLocationSelected(userCoords, 'My Current Location');
        },
        (error) => {
          setError(`Unable to get location: ${error.message}`);
          setIsLoading(false);
        }
      );
    } else {
      // For mobile, use the WebView's geolocation
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const coords = [position.coords.longitude, position.coords.latitude];
                if (map) {
                  map.flyTo({ center: coords, zoom: 15 });
                  if (marker) marker.remove();
                  clearRoute();
                  marker = new vietmapgl.Marker({ color: '#FDC700' })
                    .setLngLat(coords)
                    .setPopup(new vietmapgl.Popup().setHTML('<b>My Location</b><br>Click marker to confirm'))
                    .addTo(map);
                  marker.togglePopup();
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
                console.error('Geolocation error:', error);
              }
            );
          }
        `);
      }
    }
  }, [handleTempLocationSelected]);

  // Handle marker click to confirm location
  const handleMarkerClick = useCallback((coords: { lat: number; lng: number }, address: string) => {
    setSelectedCoords(coords);
    setTempCoords(null);
    setShowSubmitForm(true);
  }, []);

  // Update ref when callback changes
  useEffect(() => {
    handleMarkerClickRef.current = handleMarkerClick;
  }, [handleMarkerClick]);

  // Handle WebView messages (for mobile)
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOCATION_SELECTED') {
        handleTempLocationSelected(
          { lat: data.lat, lng: data.lng },
          data.address || 'Selected location'
        );
      } else if (data.type === 'MARKER_CLICKED') {
        handleMarkerClick(
          { lat: data.lat, lng: data.lng },
          data.address || 'Selected location'
        );
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Handle map initialization for web platform
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || 'YOUR_API_KEY_HERE';

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
      });
    };

    const loadStylesheet = (href: string): void => {
      const existingLink = document.querySelector(`link[href="${href}"]`);
      if (existingLink) return;

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    const initWebMap = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!webMapRef.current) {
          console.warn('Web map ref not available');
          return;
        }

        const mapElement = webMapRef.current as any;
        const domElement =
          mapElement._internalFiberInstanceHandleDEV?.stateNode ||
          mapElement._reactInternalFiber ||
          mapElement;

        let htmlElement: HTMLElement | null = null;
        if (domElement && domElement.nodeType === 1) {
          htmlElement = domElement;
        } else if (typeof document !== 'undefined') {
          htmlElement =
            document.getElementById('web-map-container') ||
            (() => {
              const div = document.createElement('div');
              div.id = 'web-map-container';
              div.style.width = '100%';
              div.style.height = '100%';
              div.style.minHeight = '400px';
              if (mapElement && mapElement.appendChild) {
                mapElement.appendChild(div);
              }
              return div;
            })();
        }

        if (!htmlElement) {
          console.error('Could not find HTML element for map');
          return;
        }

        loadStylesheet(`https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.css`);
        await loadScript(`https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.js`);

        let retries = 0;
        let vietmapgl: any = null;

        while (retries < 25) {
          if ((window as any).vietmapgl) {
            vietmapgl = (window as any).vietmapgl;
            break;
          }

          if ((globalThis as any).vietmapgl) {
            vietmapgl = (globalThis as any).vietmapgl;
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 200));
          retries++;
        }

        if (!vietmapgl) {
          console.error('Script loaded but vietmapgl not found. Checking available globals...');
          const vietKeys = Object.keys(window).filter(
            (k) => k.toLowerCase().includes('viet') || k.toLowerCase().includes('map')
          );
          console.error('VietMap-related globals:', vietKeys);
          console.error('All window properties:', Object.keys(window).slice(0, 20));
          throw new Error(
            'VietMap library failed to load. The script loaded but vietmapgl is not available in global scope.'
          );
        }

        const schoolLngLat: [number, number] = [schoolLocation.lng, schoolLocation.lat];
        const schoolNameHtml = sanitizeHtml(schoolName);
        const schoolAddressHtml = schoolAddress ? sanitizeHtml(schoolAddress) : '';
        const schoolPopupHtml =
          schoolAddressHtml.length > 0
            ? `<b>${schoolNameHtml}</b><br />${schoolAddressHtml}`
            : `<b>${schoolNameHtml}</b>`;

        htmlElement.innerHTML = '<div id="web-map" style="width: 100%; height: 100%;"></div>';

        const mapContainer = htmlElement.querySelector('#web-map') as HTMLElement;
        if (!mapContainer) {
          throw new Error('Could not create map container');
        }

        const map = new vietmapgl.Map({
          container: mapContainer,
          style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`,
          center: schoolLngLat,
          zoom: 14,
        });

        (webMapRef.current as any)._mapInstance = map;

        let marker: any = null;
        let routeLayer: any = null;
        let routeSource: any = null;

        const clearRoute = () => {
          if (routeLayer && map.getLayer(routeLayer)) {
            map.removeLayer(routeLayer);
          }
          if (routeSource && map.getSource(routeSource)) {
            map.removeSource(routeSource);
          }
          routeLayer = null;
          routeSource = null;
        };

        const drawRoute = (coordinates: { lat: number; lng: number }[]) => {
          clearRoute();

          const sourceId = 'route-source';
          const layerId = 'route-layer';

          const geoJsonData = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates.map((coord) => [coord.lng, coord.lat]),
            },
          };

          if (map.getSource(sourceId)) {
            (map.getSource(sourceId) as any).setData(geoJsonData);
          } else {
            map.addSource(sourceId, {
              type: 'geojson',
              data: geoJsonData,
            });
          }

          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#0066CC',
                'line-width': 4,
              },
            });
          }

          routeLayer = layerId;
          routeSource = sourceId;
        };

        map.on('load', () => {
          const schoolMarker = new vietmapgl.Marker({ color: 'red' })
            .setLngLat(schoolLngLat)
            .setPopup(new vietmapgl.Popup().setHTML(schoolPopupHtml))
            .addTo(map);
          (map as any)._schoolMarker = schoolMarker;
        });

        map.on('click', async (e: any) => {
          if (marker && e.originalEvent) {
            const markerElement = marker.getElement();
            if (markerElement && markerElement.contains(e.originalEvent.target)) {
              const coords = marker.getLngLat();
              if (handleMarkerClickRef.current) {
                handleMarkerClickRef.current(
                  { lat: coords.lat, lng: coords.lng },
                  'Selected location'
                );
              }
              return;
            }
          }

          const coords = e.lngLat;

          if (marker) marker.remove();
          clearRoute();

          marker = new vietmapgl.Marker({ color: '#FDC700' })
            .setLngLat(coords)
            .setPopup(
              new vietmapgl.Popup().setHTML('<b>Selected Location</b><br>Click marker to confirm')
            )
            .addTo(map);

          (map as any)._marker = marker;
          marker.togglePopup();

          if (handleTempLocationSelectedRef.current) {
            handleTempLocationSelectedRef.current(
              { lat: coords.lat, lng: coords.lng },
              'Selected location'
            );
          }
        });

        const handleRouteData = (coordinates: { lat: number; lng: number }[]) => {
          if (coordinates && coordinates.length > 0) {
            drawRoute(coordinates);
          }
        };

        (map as any)._drawRoute = handleRouteData;
        (map as any)._marker = null;

        mapInstanceRef.current = map;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
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
        `;
        buttonContainer.innerHTML = `
          <p><strong>School Location:</strong> ${schoolNameHtml}</p>
          ${schoolAddressHtml ? `<p style="font-size: 12px; color: #666; margin-top: -6px;">${schoolAddressHtml}</p>` : ''}
          <p style="font-size: 12px; color: #666;">Click on the map to select your home location</p>
          <button id="get-location-btn" style="
            background: #FDC700;
            color: black;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
          ">📍 Get My Location</button>
        `;

        htmlElement.appendChild(buttonContainer);

        const getLocationBtn = buttonContainer.querySelector('#get-location-btn');
        if (getLocationBtn) {
          getLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const coords = [position.coords.longitude, position.coords.latitude];
                  map.flyTo({ center: coords, zoom: 15 });

                  if (marker) marker.remove();

                  marker = new vietmapgl.Marker({ color: '#FDC700' })
                    .setLngLat(coords)
                    .setPopup(new vietmapgl.Popup().setHTML('<b>My Location</b>'))
                    .addTo(map);

                  (map as any)._marker = marker;

                  if (handleTempLocationSelectedRef.current) {
                    handleTempLocationSelectedRef.current(
                      { lat: position.coords.latitude, lng: position.coords.longitude },
                      'My Current Location'
                    );
                  }
                },
                (error) => {
                  console.error('Geolocation error:', error);
                }
              );
            }
          });
        }
      } catch (error) {
        console.error('Error initializing web map:', error);
        if (webMapRef.current) {
          const mapElement = webMapRef.current as any;
          const htmlElement = mapElement._internalFiberInstanceHandleDEV?.stateNode || mapElement;
          if (htmlElement && htmlElement.innerHTML !== undefined) {
            htmlElement.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: red; padding: 20px;">
                <div>
                  <p>⚠️ Failed to load map</p>
                  <p style="font-size: 12px;">${
                    error instanceof Error ? error.message : 'Unknown error'
                  }</p>
                </div>
              </div>
            `;
          }
        }
      }
    };

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove?.();
      mapInstanceRef.current = null;
    }

    initWebMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove?.();
        mapInstanceRef.current = null;
      }
    };
  }, [schoolAddress, schoolName, schoolLocation.lat, schoolLocation.lng]);

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
        studentIds: students.map((s) => s.id),
        addressText: searchQuery || 'Selected location',
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        distanceKm: distanceKm,
        description: `Pickup point request for ${students.length} student(s)`,
        reason: 'Parent requested pickup point service',
      };

      const result = await pickupPointApi.submitRequest(payload);
      setSubmitSuccess(result.message || 'Request submitted successfully!');

      // Clear storage and navigate back after success
      await AsyncStorage.removeItem('selectedStudents');
      await AsyncStorage.removeItem('parentEmail');
      
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

  // Generate HTML for WebView with simple map interface (for mobile)
  // Use useMemo to cache HTML and prevent WebView reload
  const mapHTML = useMemo(() => {
    const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || 'YOUR_API_KEY_HERE';
    const schoolLng = schoolLocation.lng;
    const schoolLat = schoolLocation.lat;
    const schoolNameHtml = sanitizeHtml(schoolName);
    const schoolAddressHtml = schoolAddress ? sanitizeHtml(schoolAddress) : '';
    const schoolPopupHtml =
      schoolAddressHtml.length > 0
        ? `<b>${schoolNameHtml}</b><br />${schoolAddressHtml}`
        : `<b>${schoolNameHtml}</b>`;
    const infoPanelAddress = schoolAddressHtml
      ? `<p style="font-size: 12px; color: #666; margin-top: -6px;">${schoolAddressHtml}</p>`
      : '';

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
  <script src="https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.js"></script>
  <link href="https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.css" rel="stylesheet">
</head>
<body>
  <div id="map"></div>
  <div class="info-panel">
    <p><strong>School Location:</strong> ${schoolNameHtml}</p>
    ${infoPanelAddress}
    <p style="font-size: 12px; color: #666;">Click on the map to select your home location</p>
    <button class="button" onclick="getCurrentLocation()">📍 Get My Location</button>
    <div id="error" class="error"></div>
  </div>
  <script>
    const schoolLocation = [${schoolLng}, ${schoolLat}];
    let map;
    let marker = null;
    let routeLayer = null;
    let routeSource = null;
    const apiKey = '${apiKey}';
    
    function showError(msg) {
      const errorDiv = document.getElementById('error');
      if (errorDiv) {
        errorDiv.textContent = msg;
      }
    }
    
    function clearRoute() {
      if (routeLayer && map.getLayer(routeLayer)) {
        map.removeLayer(routeLayer);
      }
      if (routeSource && map.getSource(routeSource)) {
        map.removeSource(routeSource);
      }
      routeLayer = null;
      routeSource = null;
    }
    
    function drawRoute(coordinates) {
      clearRoute();
      
      const sourceId = 'route-source';
      const layerId = 'route-layer';
      
      const geoJsonData = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates.map(coord => [coord.lng, coord.lat])
        }
      };
      
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geoJsonData);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geoJsonData
        });
      }
      
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#0066CC',
            'line-width': 4
          }
        });
      }
      
      routeLayer = layerId;
      routeSource = sourceId;
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
            .setPopup(new vietmapgl.Popup().setHTML('${schoolPopupHtml}'))
            .addTo(map);
        });
        
        // Handle map click
        map.on('click', (e) => {
          // Check if click is on marker
          if (marker && e.originalEvent) {
            const markerElement = marker.getElement();
            if (markerElement && markerElement.contains(e.originalEvent.target)) {
              // Click on marker - confirm location
              const coords = marker.getLngLat();
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'MARKER_CLICKED',
                  lat: coords.lat,
                  lng: coords.lng,
                  address: 'Selected location'
                }));
              }
              return;
            }
          }
          
          // Click on map - select new location
          const coords = e.lngLat;
          
          if (marker) marker.remove();
          clearRoute();
          
          marker = new vietmapgl.Marker({ color: '#FDC700' })
            .setLngLat(coords)
            .setPopup(new vietmapgl.Popup().setHTML('<b>Selected Location</b><br>Click marker to confirm'))
            .addTo(map);
          
          marker.togglePopup();
          
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
        
        // Expose drawRoute function for React Native to call
        window.drawRoute = drawRoute;
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
              clearRoute();
              
              marker = new vietmapgl.Marker({ color: '#FDC700' })
                .setLngLat(coords)
                .setPopup(new vietmapgl.Popup().setHTML('<b>My Location</b><br>Click marker to confirm'))
                .addTo(map);
              
              marker.togglePopup();
              
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
  }, [schoolAddress, schoolLocation.lat, schoolLocation.lng, schoolName]);

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
        <View style={styles.errorScreenContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF5350" />
          <Text style={styles.errorScreenText}>{error}</Text>
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
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Search Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchInputChange}
                placeholder="Enter your home address..."
                placeholderTextColor="#999"
                onSubmitEditing={handleSearch}
              />
              {isSearching && (
                <View style={styles.searchLoading}>
                  <ActivityIndicator size="small" color="#FDC700" />
                </View>
              )}
            </View>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <ScrollView style={styles.searchResultsList} nestedScrollEnabled>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSearchResultSelect(result)}
                      style={styles.searchResultItem}>
                      <Text style={styles.searchResultName}>{result.display}</Text>
                      <Text style={styles.searchResultAddress}>{result.address}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={handleGetMyLocation}
                style={styles.actionButton}
                disabled={isLoading}>
                <Ionicons name="location" size={20} color="#000000" />
                <Text style={styles.actionButtonText}>Get My Location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSearch}
                style={[styles.actionButton, styles.searchButton]}
                disabled={!searchQuery.trim() || isSearching}>
                <Text style={styles.actionButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
            
            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Map Container */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              // Web platform: render map directly using View (which becomes div on web)
              <View
                ref={webMapRef}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 400,
                }}
              />
            ) : (
              // Mobile platform: use WebView
              <WebView
                ref={webViewRef}
                source={{ html: mapHTML }}
                style={styles.webview}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                originWhitelist={['*']}
                mixedContentMode="always"
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FDC700" />
                  </View>
                )}
              />
            )}
          </View>

          {/* Info Panel - Fee Calculation */}
          {tempCoords && (
            <View style={styles.feeCalculationContainer}>
              {isRouting ? (
                <View style={styles.feeCalculationHeader}>
                  <ActivityIndicator size="small" color="#FDC700" />
                  <Text style={styles.feeCalculationTitle}>Calculating route...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.feeCalculationHeader}>
                    <Text style={styles.feeCalculationEmoji}>💰</Text>
                    <Text style={styles.feeCalculationTitle}>Fee Calculation</Text>
                  </View>
                  {(distance || duration) && (
                    <Text style={styles.feeCalculationSubtitle}>
                      {distance && duration ? `${distance} • ${duration}` : distance || duration}
                    </Text>
                  )}
                  
                  <View style={styles.feeCalculationGrid}>
                    {fare && (
                      <View style={styles.feeCalculationItem}>
                        <Text style={styles.feeCalculationLabel}>Per Trip Cost</Text>
                        <Text style={styles.feeCalculationValue}>{fare}</Text>
                      </View>
                    )}
                    
                    <View style={styles.feeCalculationItem}>
                      <Text style={styles.feeCalculationLabel}>Semester Total</Text>
                      {semesterFeeInfo ? (
                        <Text style={styles.feeCalculationValue}>
                          {semesterFeeInfo.totalFee.toLocaleString('vi-VN')}₫
                        </Text>
                      ) : semesterFeeLoading ? (
                        <Text style={styles.feeCalculationLoading}>🔄 Calculating...</Text>
                      ) : semesterFeeError ? (
                        <Text style={styles.feeCalculationError}>⚠️ Error</Text>
                      ) : (
                        <Text style={styles.feeCalculationPending}>Pending...</Text>
                      )}
                    </View>
                  </View>
                  
                  <Text style={styles.feeCalculationHint}>
                    💡 Click on the map marker to confirm this location
                  </Text>
                </>
              )}
            </View>
          )}
        </ScrollView>
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
                  • {s.firstName} {s.lastName}
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
                <Text style={styles.errorBoxText}>{submitError}</Text>
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
    height: 400,
    marginBottom: 12,
  },
  webview: {
    flex: 1,
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
    marginBottom: 12,
  },
  feeCalculationContainer: {
    backgroundColor: '#FEFCE8',
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FDC700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feeCalculationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  feeCalculationEmoji: {
    fontSize: 24,
  },
  feeCalculationTitle: {
    fontSize: 20,
    fontFamily: 'RobotoSlab-Bold',
    color: '#000000',
  },
  feeCalculationSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  feeCalculationGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  feeCalculationItem: {
    flex: 1,
    alignItems: 'center',
  },
  feeCalculationLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  feeCalculationValue: {
    fontSize: 24,
    fontFamily: 'RobotoSlab-Bold',
    color: '#D08700',
  },
  feeCalculationLoading: {
    fontSize: 16,
    color: '#666666',
  },
  feeCalculationError: {
    fontSize: 14,
    color: '#D32F2F',
  },
  feeCalculationPending: {
    fontSize: 16,
    color: '#666666',
  },
  feeCalculationHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
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
  infoHint: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FDC700',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: 'RobotoSlab-Regular',
    color: '#000000',
  },
  searchLoading: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  searchResults: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultName: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
    color: '#000000',
    marginBottom: 4,
  },
  searchResultAddress: {
    fontSize: 14,
    color: '#666666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FDC700',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButton: {
    backgroundColor: '#FDC700',
  },
  actionButtonText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#000000',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
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
  errorBoxText: {
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
  errorScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorScreenText: {
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
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
