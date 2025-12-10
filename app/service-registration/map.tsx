import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import {
  pickupPointApi,
  REUSE_PICKUP_POINT_STORAGE_KEY,
  type ReusePickupPointPayload,
} from '@/lib/parent/pickupPoint.api';
import { childrenApi } from '@/lib/parent/children.api';
import { authApi } from '@/lib/auth/auth.api';
import { useSchoolInfo } from '@/hooks/useSchoolInfo';
import type { Child } from '@/lib/parent/children.type';
import { multiStudentPolicyApi, type CalculatePerStudentResponse } from '@/lib/parent/multiStudentPolicy.api';

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

    // VietMap Directions API expects coordinates in "lng,lat" order
    const originPoint = `${origin.lng},${origin.lat}`;
    const destPoint = `${destination.lng},${destination.lat}`;

    params.append('point', originPoint);
    params.append('point', destPoint);

    const url = `${baseUrl}?${params}`;
    console.log('[getRoute] Requesting route:', {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      url: url.replace(apikey, '***')
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
      messages: data.messages
    });

    if (data.code !== 'OK' || !data.paths || data.paths.length === 0) {
      console.error('[getRoute] ❌ Route API error:', data.messages || data.error || 'No paths found');
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
  const [distanceKmValue, setDistanceKmValue] = useState<number>(0);
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
  const [discountResponse, setDiscountResponse] = useState<CalculatePerStudentResponse | null>(null);
  const [prefilledPickupPoint, setPrefilledPickupPoint] = useState<ReusePickupPointPayload | null>(null);
  const [existingStudentCount, setExistingStudentCount] = useState(0);
  const [unitPriceReady, setUnitPriceReady] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const webViewRef = useRef<WebView>(null);
  // NOTE: These refs are only used for the direct VietMap GL web implementation.
  // To make the screen work better with Expo Go, we'll now rely solely on WebView
  // (with embedded HTML) for ALL platforms, so these are commented out.
  // const webMapRef = useRef<any>(null);
  // const routeLayerRef = useRef<any>(null);
  // const routeSourceRef = useRef<any>(null);
  const handleTempLocationSelectedRef = useRef<((coords: { lat: number; lng: number }, address: string) => Promise<void>) | null>(null);
  const handleMarkerClickRef = useRef<((coords: { lat: number; lng: number }, address: string) => void) | null>(null);
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

  // Fetch how many of this parent's students are already at the pickup point (or within 200m of the selected location)
  const loadExistingStudentCount = useCallback(
    async (pickupPointId?: string | null, coords?: { lat: number; lng: number } | null) => {
      // Default: no existing students considered
      if ((!pickupPointId || pickupPointId === '') && !coords) {
        setExistingStudentCount(0);
        return;
      }

      try {
        const count = pickupPointId
          ? await pickupPointApi.getExistingStudentCount({ pickupPointId, parentEmail: parentEmail || undefined })
          : await pickupPointApi.getExistingStudentCount({
              latitude: coords!.lat,
              longitude: coords!.lng,
              radiusMeters: 200,
              parentEmail: parentEmail || undefined,
            });

        setExistingStudentCount(typeof count === 'number' ? count : 0);
      } catch (err) {
        console.warn('Could not load existing student count', err);
        setExistingStudentCount(0);
      }
    },
    [parentEmail]
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

  // Recompute discount once fee info is available
  useEffect(() => {
    if (semesterFeeInfo && students.length > 0) {
      const perStudent = semesterFeeInfo.totalFee; // current flow: fee is per student
      void calculateDiscounts(perStudent);
    } else {
      setDiscountResponse(null);
    }
  }, [semesterFeeInfo, students.length, calculateDiscounts]);

  // Calculate per-student discounts (after fee known)
  const calculateDiscounts = useCallback(
    async (originalPerStudent: number) => {
      if (students.length === 0) {
        setDiscountResponse(null);
        return;
      }
      try {
        const resp = await multiStudentPolicyApi.calculatePerStudent({
          studentCount: students.length,
          existingCount: existingStudentCount,
          originalFeePerStudent: originalPerStudent,
        });
        setDiscountResponse(resp);
      } catch (err) {
        console.warn('Could not calculate per-student discount', err);
        setDiscountResponse(null);
      }
    },
    [students.length, existingStudentCount]
  );

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
        // Handle multiple possible VietMap formats
        let lat: number | null = null;
        let lng: number | null = null;

        const coordsObj = (data as any).coordinates || (data as any).coord || (data as any).location || (data as any).geometry?.location;

        // 1) Object with lat/lng or latitude/longitude
        if (coordsObj && typeof coordsObj === 'object' && !Array.isArray(coordsObj)) {
          if (
            (coordsObj.lat !== undefined || coordsObj.latitude !== undefined) &&
            (coordsObj.lng !== undefined || coordsObj.longitude !== undefined)
          ) {
            lat = coordsObj.lat ?? coordsObj.latitude;
            lng = coordsObj.lng ?? coordsObj.longitude;
          }
        }

        // 2) Array [lng, lat]
        if ((lat === null || lng === null) && Array.isArray(coordsObj) && coordsObj.length >= 2) {
          lng = Number(coordsObj[0]);
          lat = Number(coordsObj[1]);
        }

        // 3) String "lat,lng" or "lng,lat" (try to detect)
        if ((lat === null || lng === null) && typeof coordsObj === 'string') {
          const parts = coordsObj.split(',');
          if (parts.length >= 2) {
            const a = Number(parts[0].trim());
            const b = Number(parts[1].trim());
            // Heuristic: VietMap docs commonly use "lat,lng"
            lat = a;
            lng = b;
          }
        }

        if (lat !== null && lng !== null) {
          return { lat, lng };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting place details:', error);
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

    // New location selection => reset existing count; will reload if a nearby pickup point (<=200m) is detected.
    setExistingStudentCount(0);

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
    const routeData = await getRoute(schoolLocation, coords, apiKey);

    if (routeData) {
      const distanceKm = routeData.distance;
      setDistanceKmValue(distanceKm);
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

      // After selecting a free-form location, try to load existing students nearby (<=200m) for discount stacking eligibility
      await loadExistingStudentCount(undefined, coords);

      // Draw route on map through WebView on all platforms
      if (webViewRef.current) {
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

      setDistanceKmValue(distanceKm);
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

  useEffect(() => {
    if (!prefilledPickupPoint || !unitPriceReady || isLoading) {
      return;
    }

    const applyPrefill = async () => {
      const latestHandleTempLocationSelected = handleTempLocationSelectedRef.current;
      if (!latestHandleTempLocationSelected) {
        return;
      }

      const coords = {
        lat: prefilledPickupPoint.latitude,
        lng: prefilledPickupPoint.longitude,
      };

      try {
        await latestHandleTempLocationSelected(coords, prefilledPickupPoint.addressText);
        setSelectedCoords(coords);
        setTempCoords(null);
        setShowSubmitForm(true);
        await loadExistingStudentCount(prefilledPickupPoint.pickupPointId, coords);
      } catch (prefillError) {
        console.error('Error applying saved pickup point:', prefillError);
        Alert.alert('Không thể dùng điểm đón cũ', 'Vui lòng chọn lại điểm đón mới.');
      } finally {
        setPrefilledPickupPoint(null);
      }
    };

    applyPrefill();
  }, [prefilledPickupPoint, unitPriceReady, isLoading, loadExistingStudentCount]);

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

    // Update map position and marker via WebView for all platforms
    if (webViewRef.current) {
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

      // Lấy địa chỉ cụ thể cho vị trí hiện tại
      const addressLabel = await reverseGeocode(
        { lat: latitude, lng: longitude },
        'My Current Location'
      );

      // Update WebView map (fly, marker, popup) using these coordinates
      if (webViewRef.current) {
        const script = `
          (function() {
            const coords = [${longitude}, ${latitude}];
            if (typeof map !== 'undefined' && map && window.vietmapgl) {
              if (marker) marker.remove();
              clearRoute && clearRoute();

              marker = new vietmapgl.Marker({ color: '#FDC700' })
                .setLngLat(coords)
                .setPopup(new vietmapgl.Popup().setHTML('<b>${sanitizeHtml(
          addressLabel
        )}</b><br>Click marker to confirm'))
                .addTo(map);

              marker.togglePopup();
              map.flyTo({ center: coords, zoom: 15 });
            }
          })();
        `;
        webViewRef.current.injectJavaScript(script);
      }

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
    setShowSubmitForm(true);
  }, []);

  // Update ref when callback changes
  useEffect(() => {
    handleMarkerClickRef.current = handleMarkerClick;
  }, [handleMarkerClick]);

  // Handle WebView messages (for mobile)
  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOCATION_SELECTED') {
        // Khi user click trên map: dùng reverse geocode để lấy địa chỉ cụ thể
        const coords = { lat: data.lat, lng: data.lng };
        const resolvedAddress = await reverseGeocode(coords, 'Selected location');
        handleTempLocationSelected(
          coords,
          resolvedAddress
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

    if (!distance || distanceKmValue <= 0) {
      Alert.alert('Error', 'Please ensure distance is calculated correctly.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const payload = {
        email: parentEmail,
        studentIds: students.map((s) => s.id),
        addressText: searchQuery || 'Selected location',
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        distanceKm: distanceKmValue,
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
    return `
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
      if (routeLayer && map && map.getLayer && map.getLayer(routeLayer)) {
        map.removeLayer(routeLayer);
      }
      if (routeSource && map && map.getSource && map.getSource(routeSource)) {
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

      // Fit map to show the full route (from school to selected location)
      try {
        if (Array.isArray(coordinates) && coordinates.length > 1 && map && map.fitBounds) {
          let minLat = coordinates[0].lat;
          let maxLat = coordinates[0].lat;
          let minLng = coordinates[0].lng;
          let maxLng = coordinates[0].lng;

          for (let i = 1; i < coordinates.length; i++) {
            const c = coordinates[i];
            if (c.lat < minLat) minLat = c.lat;
            if (c.lat > maxLat) maxLat = c.lat;
            if (c.lng < minLng) minLng = c.lng;
            if (c.lng > maxLng) maxLng = c.lng;
          }

          const southWest = [minLng, minLat];
          const northEast = [maxLng, maxLat];

          map.fitBounds([southWest, northEast], {
            padding: 60,
            maxZoom: 16,
          });
        }
      } catch (e) {
        console.warn('Error fitting bounds for route:', e);
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
            // Nội dung popup sẽ được React Native cập nhật lại sau khi reverse geocode,
            // nên tạm thời chỉ hiển thị text đơn giản.
            .setPopup(new vietmapgl.Popup().setHTML('<b>Selected location</b><br>Calculating address...'))
            .addTo(map);
          
          marker.togglePopup();
          
          // Send location to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'LOCATION_SELECTED',
              lat: coords.lat,
              lng: coords.lng
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
                .setPopup(new vietmapgl.Popup().setHTML('<b>My location</b><br>Calculating address...'))
                .addTo(map);
              
              marker.togglePopup();
              
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'LOCATION_SELECTED',
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
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

            {/* Get My Location Button */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={handleGetMyLocation}
                style={styles.locationButton}
                disabled={isLoading}>
                <Ionicons name="location" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Map Container - now always rendered via WebView so it works consistently in Expo Go */}
          <View style={styles.mapContainer}>
            <WebView
              ref={webViewRef}
              source={{ html: mapHTML }}
              style={styles.webview}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              geolocationEnabled={true}
              startInLoadingState={true}
              originWhitelist={['*']}
              mixedContentMode="always"
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FDC700" />
                </View>
              )}
            />
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
                  <Text style={styles.feeCalculationEmoji}>💰</Text>
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

                <View style={styles.feeCalculationGrid}>
                  <View style={styles.feeCalculationItem}>
                    <Text style={styles.feeCalculationLabel}>Per Trip Cost</Text>
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
                        {semesterFeeInfo.totalFee.toLocaleString('vi-VN')}₫
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
                <Text style={styles.formLabel}>Semester Total (per student before discount):</Text>
                <Text style={styles.formValue}>
                  {semesterFeeInfo.totalFee.toLocaleString('vi-VN')}₫
                </Text>
              </View>
            )}

            {discountResponse && Array.isArray(discountResponse.students) && discountResponse.students.length > 0 && (
              <View style={[styles.formSection, { gap: 8 }]}>
                <Text style={styles.formLabel}>Per-student fees (after discount):</Text>
                {students.map((s, idx) => {
                  const info = discountResponse.students[idx];
                  const hasDiscount = info && info.discountPercentage > 0;
                  const original = info?.originalFee ?? semesterFeeInfo?.totalFee ?? 0;
                  const finalFee = info?.finalFee ?? original;
                  return (
                    <View
                      key={s.id || idx}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'RobotoSlab-Bold', color: '#000000' }}>
                          {s.firstName} {s.lastName}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666666' }}>
                          {hasDiscount
                            ? `Discount: -${info.discountPercentage.toFixed(0)}%`
                            : 'No discount'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        {hasDiscount ? (
                          <>
                            <Text style={{ fontSize: 12, color: '#999999', textDecorationLine: 'line-through' }}>
                              {original.toLocaleString('vi-VN')}₫
                            </Text>
                            <Text style={{ fontSize: 16, fontFamily: 'RobotoSlab-Bold', color: '#D08700' }}>
                              {finalFee.toLocaleString('vi-VN')}₫
                            </Text>
                          </>
                        ) : (
                          <Text style={{ fontSize: 16, fontFamily: 'RobotoSlab-Bold', color: '#000000' }}>
                            {finalFee.toLocaleString('vi-VN')}₫
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
                <Text style={{ fontSize: 12, color: '#666666', marginTop: 4 }}>
                  Stacked discount applies (max 100%). If no active policy, fees stay unchanged.
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
