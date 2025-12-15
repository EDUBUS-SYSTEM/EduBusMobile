import { useSchoolInfo } from '@/hooks/useSchoolInfo';
import { authApi } from '@/lib/auth/auth.api';
import { childrenApi } from '@/lib/parent/children.api';
import type { Child } from '@/lib/parent/children.type';
import {
  pickupPointApi,
  REUSE_PICKUP_POINT_STORAGE_KEY,
  type ReusePickupPointPayload,
} from '@/lib/parent/pickupPoint.api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Camera,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
  type MapViewRef,
} from '@vietmap/vietmap-gl-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
    // Validate coordinates
    if (
      !origin || !destination ||
      typeof origin.lat !== 'number' || typeof origin.lng !== 'number' ||
      typeof destination.lat !== 'number' || typeof destination.lng !== 'number' ||
      isNaN(origin.lat) || isNaN(origin.lng) || isNaN(destination.lat) || isNaN(destination.lng)
    ) {
      console.error('[getRoute] ❌ Invalid coordinates:', { origin, destination });
      return null;
    }

    // Validate coordinates are within reasonable bounds (Vietnam: lat ~8-24, lng ~102-110)
    if (
      origin.lat < -90 || origin.lat > 90 || origin.lng < -180 || origin.lng > 180 ||
      destination.lat < -90 || destination.lat > 90 || destination.lng < -180 || destination.lng > 180
    ) {
      console.error('[getRoute] ❌ Coordinates out of bounds:', { origin, destination });
      return null;
    }

    const baseUrl = 'https://maps.vietmap.vn/api/route';
    const params = new URLSearchParams({
      'api-version': '1.1',
      apikey: apiKey,
      points_encoded: 'true',
      vehicle: 'car'
    });

    // VietMap Directions API expects coordinates in "lat,lng" order
    // Ensure coordinates are valid numbers and within reasonable range
    const originLat = Number(origin.lat);
    const originLng = Number(origin.lng);
    const destLat = Number(destination.lat);
    const destLng = Number(destination.lng);

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      console.error('[getRoute] ❌ Coordinates contain NaN:', { origin, destination });
      return null;
    }

    // Validate Vietnam bounds more strictly
    if (
      originLat < 8 || originLat > 24 || originLng < 102 || originLng > 110 ||
      destLat < 8 || destLat > 24 || destLng < 102 || destLng > 110
    ) {
      console.error('[getRoute] ❌ Coordinates outside Vietnam bounds:', {
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destLat, lng: destLng }
      });
      return null;
    }

    // VietMap API expects "lat,lng" format
    const originPoint = `${originLat},${originLng}`;
    const destPoint = `${destLat},${destLng}`;

    params.append('point', originPoint);
    params.append('point', destPoint);

    const url = `${baseUrl}?${params}`;
    console.log('[getRoute] Requesting route:', {
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
      originPoint,
      destPoint,
      url: url.replace(apiKey, '***')
    });

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getRoute] ❌ HTTP error:', response.status, response.statusText, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[getRoute] Response:', {
      code: data.code,
      hasPaths: !!data.paths,
      pathsLength: data.paths?.length || 0,
      messages: data.messages,
      error: data.error
    });

    if (data.code !== 'OK' || !data.paths || data.paths.length === 0) {
      console.error('[getRoute] ❌ Route API error:', {
        code: data.code,
        messages: data.messages,
        error: data.error,
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destLat, lng: destLng },
        originPoint: `${originLat},${originLng}`,
        destPoint: `${destLat},${destLng}`
      });
      return null;
    }

    const path = data.paths[0];
    if (!path.points) {
      console.error('[getRoute] ❌ No points in path');
      return null;
    }

    const coordinates = decodePolyline(path.points);
    console.log('[getRoute] ✅ Route calculated:', {
      distance: `${(path.distance / 1000).toFixed(2)} km`,
      duration: `${Math.round(path.time / 60)} min`,
      points: coordinates.length
    });

    return {
      distance: path.distance / 1000, // Convert to km
      duration: path.time / 1000, // Convert to seconds
      coordinates
    };
  } catch (error) {
    console.error('[getRoute] ❌ Exception:', error);
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
  const [prefilledPickupPoint, setPrefilledPickupPoint] = useState<ReusePickupPointPayload | null>(null);
  const [unitPriceReady, setUnitPriceReady] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<{ lat: number; lng: number }[] | null>(null);
  const mapRef = useRef<MapViewRef>(null);
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

        const reusePayloadRaw = await AsyncStorage.getItem(REUSE_PICKUP_POINT_STORAGE_KEY);
        if (reusePayloadRaw) {
          try {
            const parsedPayload: ReusePickupPointPayload = JSON.parse(reusePayloadRaw);
            const isValidPayload =
              typeof parsedPayload.latitude === 'number' &&
              typeof parsedPayload.longitude === 'number' &&
              Array.isArray(parsedPayload.studentIds);
            const isSameSelection =
              isValidPayload &&
              parsedPayload.studentIds.length === selectedStudentIds.length &&
              parsedPayload.studentIds.every((id) => selectedStudentIds.includes(id));

            if (isValidPayload && isSameSelection) {
              setPrefilledPickupPoint(parsedPayload);
            }
          } catch (storageError) {
            console.error('Error parsing saved pickup point payload:', storageError);
          } finally {
            await AsyncStorage.removeItem(REUSE_PICKUP_POINT_STORAGE_KEY);
          }
        }

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
        setUnitPriceReady(true);
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
          data_new: item.data_new || null,
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
          data_new: item.data_new || null,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error autocomplete:', error);
      return [];
    }
  };

  // Helper function to extract coordinates from various VietMap response formats
  const extractCoordinates = (data: any): { lat: number; lng: number } | null => {
    if (!data || typeof data !== 'object') return null;

    let lat: number | null = null;
    let lng: number | null = null;

    // Try multiple possible coordinate fields
    const coordData =
      data.coordinates ||
      data.coord ||
      data.location ||
      data.geometry?.location ||
      data.geometry?.coordinates ||
      (data.lat !== undefined && data.lng !== undefined ? data : null);

    if (!coordData) return null;

    // 1) Object format: {lat, lng} or {latitude, longitude}
    if (typeof coordData === 'object' && !Array.isArray(coordData)) {
      if (coordData.lat !== undefined && coordData.lng !== undefined) {
        lat = Number(coordData.lat);
        lng = Number(coordData.lng);
      } else if (coordData.latitude !== undefined && coordData.longitude !== undefined) {
        lat = Number(coordData.latitude);
        lng = Number(coordData.longitude);
      }
    }
    // 2) Array format: [lng, lat] (GeoJSON standard)
    else if (Array.isArray(coordData) && coordData.length >= 2) {
      const val0 = Number(coordData[0]);
      const val1 = Number(coordData[1]);

      // Heuristic: if first value > 90, it's likely longitude (Vietnam lng ~102-110)
      if (Math.abs(val0) > 90) {
        lng = val0;
        lat = val1;
      } else {
        // Could be [lat, lng] - check if values make sense for Vietnam
        if (val0 >= 8 && val0 <= 24 && val1 >= 102 && val1 <= 110) {
          lat = val0;
          lng = val1;
        } else {
          // Default to GeoJSON format [lng, lat]
          lng = val0;
          lat = val1;
        }
      }
    }
    // 3) String format: "lat,lng" or "lng,lat"
    else if (typeof coordData === 'string') {
      const parts = coordData.split(',');
      if (parts.length >= 2) {
        const val0 = Number(parts[0].trim());
        const val1 = Number(parts[1].trim());
        // Heuristic: if first value > 90, it's likely longitude
        if (Math.abs(val0) > 90) {
          lng = val0;
          lat = val1;
        } else {
          lat = val0;
          lng = val1;
        }
      }
    }

    // Validate extracted coordinates
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      // Check if coordinates are swapped (lat > 90 or lng > 180)
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        // Swap them
        [lat, lng] = [lng, lat];
      }

      // Final validation: Vietnam bounds
      if (lat >= 8 && lat <= 24 && lng >= 102 && lng <= 110) {
        return { lat, lng };
      }
    }

    return null;
  };

  const getPlaceDetails = async (ref_id: string): Promise<{ lat: number; lng: number } | null> => {
    const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return null;
    }

    try {
      const params = new URLSearchParams({
        apikey: apiKey,
        refid: ref_id
      });

      const response = await fetch(`https://maps.vietmap.vn/api/place/v3?${params}`);
      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data && typeof data === 'object') {
        const coords = extractCoordinates(data);
        if (coords) {
          return coords;
        }

        const nestedData = (data as any).data || (data as any).result || (data as any).place;
        if (nestedData) {
          const nestedCoords = extractCoordinates(nestedData);
          if (nestedCoords) {
            return nestedCoords;
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Reverse geocoding: lấy địa chỉ/đường từ toạ độ
  const reverseGeocode = async (
    coords: { lat: number; lng: number },
    fallbackLabel: string
  ): Promise<string> => {
    const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('VietMap API key not configured for reverse geocoding');
      return fallbackLabel;
    }

    try {
      const params = new URLSearchParams({
        apikey: apiKey,
        // Theo tài liệu VietMap: reverse v3 nhận lng,lat
        lng: String(coords.lng),
        lat: String(coords.lat),
      });

      // Endpoint reverse geocoding của VietMap (v3)
      const response = await fetch(`https://maps.vietmap.vn/api/reverse/v3?${params.toString()}`);
      if (!response.ok) {
        console.warn('Reverse geocode failed:', response.status);
        return fallbackLabel;
      }

      const data = await response.json();

      // API có thể trả về 1 object hoặc array các candidate → lấy phần tử đầu
      const first =
        Array.isArray(data) && data.length > 0
          ? data[0]
          : data;

      // Thử lấy địa chỉ rõ nhất có thể
      const fullAddress: string =
        first?.full_address ||
        first?.display ||
        first?.address ||
        first?.name ||
        '';

      if (typeof fullAddress === 'string' && fullAddress.trim().length > 0) {
        return fullAddress.trim();
      }

      return fallbackLabel;
    } catch (err) {
      console.error('Error reverse geocoding:', err);
      return fallbackLabel;
    }
  };

  // Debounced autocomplete handler
  const autocompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setError('');
    setTempCoords(null);
    setRouteCoordinates(null);
    setDistance('');
    setDuration('');
    setFare('');
  }, []);

  // Handle temp location selection (when clicking on map or using "Get My Location")
  // Always calculate route FROM school TO the selected/current location.
  const handleTempLocationSelected = useCallback(async (coords: { lat: number; lng: number }, address: string) => {
    // Validate coordinates before proceeding
    if (
      !coords ||
      typeof coords.lat !== 'number' || typeof coords.lng !== 'number' ||
      isNaN(coords.lat) || isNaN(coords.lng)
    ) {
      console.error('[handleTempLocationSelected] ❌ Invalid coordinates:', coords);
      setError('Invalid location coordinates. Please try again.');
      return;
    }

    // Validate coordinates are within reasonable bounds
    if (
      coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180
    ) {
      console.error('[handleTempLocationSelected] ❌ Coordinates out of bounds:', coords);
      setError('Location coordinates are out of bounds. Please select a valid location.');
      return;
    }

    console.log('[handleTempLocationSelected] ✅ Valid coordinates:', coords, 'Address:', address);

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
    setRouteCoordinates(null);

    // Validate school location as well
    if (
      !schoolLocation ||
      typeof schoolLocation.lat !== 'number' || typeof schoolLocation.lng !== 'number' ||
      isNaN(schoolLocation.lat) || isNaN(schoolLocation.lng)
    ) {
      console.error('[handleTempLocationSelected] ❌ Invalid school location:', schoolLocation);
      setError('School location is invalid. Please contact support.');
      setIsRouting(false);
      return;
    }

    // Get actual route from VietMap Directions API
    // NOTE: origin = school, destination = selected/current location
    console.log('[handleTempLocationSelected] Calling getRoute with:', {
      schoolLocation: { lat: schoolLocation.lat, lng: schoolLocation.lng },
      coords: { lat: coords.lat, lng: coords.lng },
      apiKey: apiKey ? '***' : 'MISSING'
    });
    const routeData = await getRoute(schoolLocation, coords, apiKey);

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

      // Set route coordinates for rendering
      setRouteCoordinates(routeData.coordinates);
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

  useEffect(() => {
    if (!prefilledPickupPoint || !unitPriceReady || isLoading) {
      return;
    }

    const applyPrefill = async () => {
      const coords = {
        lat: prefilledPickupPoint.latitude,
        lng: prefilledPickupPoint.longitude,
      };

      try {
        await handleTempLocationSelected(coords, prefilledPickupPoint.addressText);
        setSelectedCoords(coords);
        setTempCoords(null);
        setShowSubmitForm(true);
      } catch (prefillError) {
        console.error('Error applying saved pickup point:', prefillError);
        Alert.alert('Không thể dùng điểm đón cũ', 'Vui lòng chọn lại điểm đón mới.');
      } finally {
        setPrefilledPickupPoint(null);
      }
    };

    applyPrefill();
  }, [prefilledPickupPoint, unitPriceReady, isLoading, handleTempLocationSelected]);

  // Handle search result selection
  const handleSearchResultSelect = useCallback(async (result: VietMapGeocodeResult) => {
    setShowSearchResults(false);
    setError('');
    setIsSearching(true);

    let coords: { lat: number; lng: number } | null = null;

    // Try to get coordinates from entry_points first (most accurate for navigation)
    if (result.entry_points && result.entry_points.length > 0 && result.entry_points[0].ref_id) {
      coords = await getPlaceDetails(result.entry_points[0].ref_id);
    }

    // Fallback to main ref_id
    if (!coords && result.ref_id) {
      coords = await getPlaceDetails(result.ref_id);
    }

    // If still no coordinates, try to extract from data_new using helper
    if (!coords && result.data_new) {
      coords = extractCoordinates(result.data_new);
    }

    // Try data_old as last resort using helper
    if (!coords && result.data_old) {
      coords = extractCoordinates(result.data_old);
    }

    // Try to extract directly from result object (some API versions include coords at root level)
    if (!coords) {
      coords = extractCoordinates(result);
    }

    setIsSearching(false);

    // If no coordinates found, show error instead of using random fallback
    if (!coords) {
      setError('Không thể lấy tọa độ cho địa điểm này. Vui lòng thử lại hoặc chọn địa điểm khác.');
      return;
    }

    setSearchQuery(result.display);
    setTempCoords(coords);

    // Calculate route for selected location
    handleTempLocationSelected(coords, result.display);
  }, [handleTempLocationSelected]);

  // Get user's current location - use native Expo Location for better iOS support,
  // then sync with WebView + reuse existing routing logic.
  const handleGetMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const { latitude, longitude } = position.coords;

      // Get address for current location
      const addressLabel = await reverseGeocode(
        { lat: latitude, lng: longitude },
        'My Current Location'
      );

      // Set temp coords to show marker and calculate route
      setTempCoords({ lat: latitude, lng: longitude });
      setSearchQuery(addressLabel);

      // Reuse existing logic to compute route, distance, fare, semester fee
      handleTempLocationSelected(
        { lat: latitude, lng: longitude },
        addressLabel
      );
    } catch (err) {
      console.error('Error getting current location:', err);
      setError('Unable to get current location. Please try again.');
    }
  }, [handleTempLocationSelected]);

  // Handle marker click to confirm location
  const handleMarkerClick = useCallback((coords: { lat: number; lng: number }, address: string) => {
    setSelectedCoords(coords);
    setTempCoords(null);
    setRouteCoordinates(null);
    setShowSubmitForm(true);
  }, []);

  // Handle map press to select location
  const handleMapPress = useCallback(async (feature: GeoJSON.Feature) => {
    try {
      let longitude: number | null = null;
      let latitude: number | null = null;

      // Try to get coordinates from geometry
      // GeoJSON format is [longitude, latitude]
      if (feature.geometry) {
        if (feature.geometry.type === 'Point' && feature.geometry.coordinates) {
          const coords = feature.geometry.coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            // GeoJSON standard: [longitude, latitude]
            const val0 = Number(coords[0]);
            const val1 = Number(coords[1]);

            // Heuristic: if first value > 90, it's likely longitude (Vietnam lng ~102-110)
            if (Math.abs(val0) > 90) {
              longitude = val0;
              latitude = val1;
            } else if (val0 >= 8 && val0 <= 24 && val1 >= 102 && val1 <= 110) {
              // Likely [lat, lng] format - swap them
              latitude = val0;
              longitude = val1;
            } else {
              // Default to GeoJSON format [lng, lat]
              longitude = val0;
              latitude = val1;
            }
          }
        }
      }

      // Try to get coordinates from properties
      if ((!longitude || !latitude) && feature.properties) {
        const props = feature.properties as any;
        if (props.coordinates && Array.isArray(props.coordinates) && props.coordinates.length >= 2) {
          longitude = props.coordinates[0];
          latitude = props.coordinates[1];
        } else if (props.longitude !== undefined && props.latitude !== undefined) {
          longitude = props.longitude;
          latitude = props.latitude;
        } else if (props.lng !== undefined && props.lat !== undefined) {
          longitude = props.lng;
          latitude = props.lat;
        }
      }

      if (longitude !== null && latitude !== null && !isNaN(longitude) && !isNaN(latitude)) {
        // Validate coordinates are within reasonable bounds
        // GeoJSON uses [lng, lat] format, so coords[0] is longitude, coords[1] is latitude
        // But we need to check if they might be swapped (lat should be 8-24 for Vietnam, lng should be 102-110)
        let finalLat = latitude;
        let finalLng = longitude;

        // Check if coordinates seem swapped based on Vietnam bounds
        // Vietnam: lat ~8-24, lng ~102-110
        const latInRange = latitude >= 8 && latitude <= 24;
        const lngInRange = longitude >= 102 && longitude <= 110;
        const latLooksLikeLng = latitude >= 102 && latitude <= 110;
        const lngLooksLikeLat = longitude >= 8 && longitude <= 24;

        if ((latLooksLikeLng && lngLooksLikeLat) || (!latInRange && !lngInRange && latLooksLikeLng)) {
          // Likely swapped - swap them
          console.log('[handleMapPress] ⚠️ Coordinates appear swapped, swapping...', { original: { lat: latitude, lng: longitude } });
          finalLat = longitude;
          finalLng = latitude;
        }

        // Final validation for Vietnam bounds
        if (finalLat >= 8 && finalLat <= 24 && finalLng >= 102 && finalLng <= 110) {
          console.log('[handleMapPress] ✅ Valid coordinates:', { lat: finalLat, lng: finalLng });
          // Use reverse geocode to get address
          const resolvedAddress = await reverseGeocode(
            { lat: finalLat, lng: finalLng },
            'Selected location'
          );
          handleTempLocationSelected(
            { lat: finalLat, lng: finalLng },
            resolvedAddress
          );
        } else {
          console.error('[handleMapPress] ❌ Coordinates outside Vietnam bounds:', { lat: finalLat, lng: finalLng });
          setError('Selected location is outside Vietnam. Please select a valid location.');
        }
      } else {
        console.error('[handleMapPress] ❌ Invalid coordinates extracted:', { longitude, latitude });
      }
    } catch (error) {
      console.error('Error handling map press:', error);
    }
  }, [handleTempLocationSelected, reverseGeocode]);

  // NOTE: The original implementation included a large block of VietMap GL JS
  // initialization code for the web platform (using direct DOM APIs and a map
  // instance attached to a View ref). Since we're standardizing on the WebView
  // + HTML approach for all platforms (including web) to make it work better 
  // with Expo Go and avoid custom DOM integration, that web-specific block has 
  // been removed/commented out.

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

  // Calculate map bounds to fit school and selected location
  const getMapBounds = useCallback(() => {
    const points: [number, number][] = [[schoolLocation.lng, schoolLocation.lat]];

    if (tempCoords) {
      points.push([tempCoords.lng, tempCoords.lat]);
    }

    if (points.length === 1) {
      return {
        centerCoordinate: points[0] as [number, number],
        zoomLevel: 14,
      };
    }

    const lngs = points.map(p => p[0]);
    const lats = points.map(p => p[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    const lngDiff = maxLng - minLng;
    const latDiff = maxLat - minLat;
    const maxDiff = Math.max(lngDiff, latDiff);

    let zoomLevel = 14;
    if (maxDiff > 0.1) zoomLevel = 12;
    else if (maxDiff > 0.05) zoomLevel = 13;
    else if (maxDiff > 0.02) zoomLevel = 14;
    else if (maxDiff > 0.01) zoomLevel = 15;
    else zoomLevel = 16;

    return {
      centerCoordinate: [centerLng, centerLat] as [number, number],
      zoomLevel,
    };
  }, [schoolLocation, tempCoords]);

  const getCameraSettings = useCallback(() => {
    if (tempCoords) {
      return {
        centerCoordinate: [tempCoords.lng, tempCoords.lat] as [number, number],
        zoomLevel: 15,
      };
    }
    return getMapBounds();
  }, [tempCoords, getMapBounds]);

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
        colors={['#FFD700', '#FFEB3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Pickup Point</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      {!showSubmitForm ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              {isSearching ? (
                <View style={styles.searchLoading}>
                  <ActivityIndicator size="small" color="#FDC700" />
                </View>
              ) : searchQuery.trim().length > 0 ? (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  style={styles.clearButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={24} color="#999" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <ScrollView style={styles.searchResultsList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
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

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Map Container */}
          <View style={styles.mapWrapper}>
            <View style={styles.mapContainer}>
              {(() => {
                const apiKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || '';
                const mapStyle = apiKey
                  ? `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`
                  : undefined;

                if (!mapStyle) {
                  return (
                    <View style={styles.mapError}>
                      <Ionicons name="map-outline" size={48} color="#9E9E9E" />
                      <Text style={styles.mapErrorText}>
                        Map not available{'\n'}
                        Please configure VietMap API key
                      </Text>
                    </View>
                  );
                }

                return (
                  <MapView
                    ref={mapRef}
                    style={styles.map}
                    mapStyle={mapStyle}
                    onPress={handleMapPress}
                    logoEnabled={false}
                  >
                    <Camera
                      defaultSettings={{
                        centerCoordinate: [schoolLocation.lng, schoolLocation.lat] as [number, number],
                        zoomLevel: 14,
                        animationDuration: 0,
                      }}
                      centerCoordinate={getCameraSettings().centerCoordinate}
                      zoomLevel={getCameraSettings().zoomLevel}
                      animationDuration={tempCoords ? 500 : 0}
                    />

                    {/* Route from school to selected location */}
                    {routeCoordinates && routeCoordinates.length > 0 && (
                      <ShapeSource
                        id="route-source"
                        shape={{
                          type: 'Feature',
                          properties: {},
                          geometry: {
                            type: 'LineString',
                            coordinates: routeCoordinates.map(coord => [coord.lng, coord.lat]),
                          },
                        }}
                      >
                        <LineLayer
                          id="route-layer"
                          style={{
                            lineColor: '#0066CC',
                            lineWidth: 4,
                            lineCap: 'round',
                            lineJoin: 'round',
                          }}
                        />
                      </ShapeSource>
                    )}

                    {/* School marker */}
                    <PointAnnotation
                      id="school-location"
                      coordinate={[schoolLocation.lng, schoolLocation.lat]}
                      anchor={{ x: 0.5, y: 1 }}
                    >
                      <View style={styles.schoolMarkerContainer}>
                        <Ionicons name="school" size={32} color="#FFFFFF" />
                      </View>
                    </PointAnnotation>

                    {/* Selected location marker */}
                    {tempCoords && (
                      <PointAnnotation
                        id="selected-location"
                        coordinate={[tempCoords.lng, tempCoords.lat]}
                        anchor={{ x: 0.5, y: 1 }}
                        onSelected={() => {
                          if (tempCoords) {
                            handleMarkerClick(
                              tempCoords,
                              searchQuery || 'Selected location'
                            );
                          }
                        }}
                      >
                        <View style={styles.selectedMarkerContainer}>
                          <Ionicons name="location" size={40} color="#FDC700" />
                        </View>
                      </PointAnnotation>
                    )}
                  </MapView>
                );
              })()}
            </View>

            {/* Get My Location Button - Bottom Left */}
            <TouchableOpacity
              onPress={handleGetMyLocation}
              style={styles.mapLocationButton}
              disabled={isLoading}>
              <Ionicons name="locate" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Info Panel - Fee Calculation */}
          <View style={styles.feeCalculationContainer}>
            {isRouting ? (
              <View style={styles.feeCalculationHeader}>
                <ActivityIndicator size="small" color="#FDC700" />
                <Text style={styles.feeCalculationTitle}>Calculating route...</Text>
              </View>
            ) : (
              <>
                <View style={styles.feeCalculationHeader}>
                  <Text style={styles.feeCalculationTitle}>Fee Calculation</Text>
                </View>
                {tempCoords && (distance || duration) ? (
                  <Text style={styles.feeCalculationSubtitle}>
                    {distance && duration ? `${distance} • ${duration}` : distance || duration}
                  </Text>
                ) : (
                  <Text style={styles.feeCalculationSubtitle}>
                    Select a location to calculate route
                  </Text>
                )}

                {unitPrice > 0 && (
                  <View style={styles.feeCalculationPricePerKm}>
                    <Text style={styles.feeCalculationPricePerKmLabel}>Price per km:</Text>
                    <Text style={styles.feeCalculationPricePerKmValue}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0,
                      }).format(unitPrice)}
                    </Text>
                  </View>
                )}

                <View style={styles.feeCalculationGrid}>
                  <View style={styles.feeCalculationItem}>
                    <Text style={styles.feeCalculationLabel}>Per Day</Text>
                    {fare ? (
                      <Text style={styles.feeCalculationValue}>{fare}</Text>
                    ) : (
                      <Text style={styles.feeCalculationValue}>0₫</Text>
                    )}
                  </View>

                  <View style={styles.feeCalculationItem}>
                    <Text style={styles.feeCalculationLabel}>Semester Total</Text>
                    {semesterFeeInfo ? (
                      <Text style={styles.feeCalculationValue}>
                        {new Intl.NumberFormat('vi-VN', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(Math.round(semesterFeeInfo.totalFee / 1000) * 1000)}₫
                      </Text>
                    ) : semesterFeeLoading ? (
                      <Text style={styles.feeCalculationLoading}>🔄 Calculating...</Text>
                    ) : semesterFeeError ? (
                      <Text style={styles.feeCalculationError}>⚠️ Error</Text>
                    ) : (
                      <Text style={styles.feeCalculationValue}>0₫</Text>
                    )}
                  </View>
                </View>

                {tempCoords ? (
                  <Text style={styles.feeCalculationHint}>
                    💡 Click on the map marker to confirm this location
                  </Text>
                ) : (
                  <Text style={styles.feeCalculationHint}>
                    💡 Search for an address or click on the map to select a location
                  </Text>
                )}
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

            {unitPrice > 0 && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Price per km:</Text>
                <Text style={styles.formValue}>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    minimumFractionDigits: 0,
                  }).format(unitPrice)}
                </Text>
              </View>
            )}

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Children({students.length}):</Text>
              {students.map((s, idx) => (
                <Text key={s.id || idx} style={styles.studentItem}>
                  • {s.firstName} {s.lastName}
                </Text>
              ))}
            </View>

            {fare && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Per Day:</Text>
                <Text style={styles.formValue}>{fare}</Text>
              </View>
            )}

            {semesterFeeInfo && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Semester Total:</Text>
                <Text style={styles.formValue}>
                  {new Intl.NumberFormat('vi-VN', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(Math.round(semesterFeeInfo.totalFee / 1000) * 1000)}₫
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
  mapWrapper: {
    position: 'relative',
    marginBottom: 8,
    marginHorizontal: 12,
  },
  mapContainer: {
    height: 600,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  mapError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 20,
  },
  mapErrorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'RobotoSlab-Regular',
  },
  schoolMarkerContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    marginHorizontal: 12,
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
  feeCalculationPricePerKm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  feeCalculationPricePerKmLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'RobotoSlab-Regular',
  },
  feeCalculationPricePerKmValue: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    color: '#D08700',
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
    marginHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 10,
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
    paddingRight: 50,
    fontSize: 16,
    fontFamily: 'RobotoSlab-Regular',
    color: '#000000',
  },
  searchLoading: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
    zIndex: 1,
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
    marginBottom: 12,
  },
  locationButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDC700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mapLocationButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDC700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
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
