import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Easing } from 'react-native';
import { Image } from 'expo-image';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { hideAlert } from '../../store/slices/notificationAlertSlice';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';

export const NotificationAlert = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const alert = useAppSelector(state => state.notificationAlert);

  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const [cachedContent, setCachedContent] = useState<{ title?: string; message?: string; tripId?: string }>({});
  const isHidingRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  // Debug: Log alert state changes
  useEffect(() => {
    console.log('🔔 ArrivalAlert state:', {
      isVisible: alert.isVisible,
      title: alert.title,
      message: alert.message,
      tripId: alert.tripId,
    });
  }, [alert.isVisible, alert.title, alert.message, alert.tripId]);

  // Handle button press - defined before early return to follow Rules of Hooks
  const handlePress = useCallback(() => {
    const tripId = alert.tripId || cachedContent.tripId;
    if (tripId) router.push(`/(parent-tabs)/trip/${tripId}`);
    dispatch(hideAlert());
  }, [alert.tripId, cachedContent.tripId, router, dispatch]);

  // Track when alert becomes visible to start rendering and cache content
  useEffect(() => {
    if (alert.isVisible) {
      setShouldRender(true);
      // Cache the content so it persists during hide animation
      setCachedContent({
        title: alert.title,
        message: alert.message,
        tripId: alert.tripId,
      });
    }
  }, [alert.isVisible, alert.title, alert.message, alert.tripId]);

  // Animation effect when alert shows/hides
  useEffect(() => {
    if (alert.isVisible) {
      // Reset hiding flag when showing
      isHidingRef.current = false;
      // Show animation: slide down + fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (shouldRender && !isHidingRef.current) {
      // Hide animation: slide up + fade out (very slow and smooth)
      isHidingRef.current = true;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: 1000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Only unmount after animation completes
        setShouldRender(false);
        setCachedContent({});
        isHidingRef.current = false;
      });
    }
  }, [alert.isVisible, shouldRender, slideAnim, fadeAnim]);

  // Auto-hide alert after 15 seconds
  useEffect(() => {
    if (alert.isVisible) {
      const timer = setTimeout(() => {
        dispatch(hideAlert());
      }, 10000); // 15 seconds

      return () => clearTimeout(timer);
    }
  }, [alert.isVisible, dispatch]);

    useEffect(() => {
    let isMounted = true;

    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/siuu-sound-effect.mp3')
        );

        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        await sound.setVolumeAsync(0.7);
      } catch (error) {
        console.error('🔊 Failed to load arrival alert sound:', error);
      }
    };

    loadSound();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current
          .unloadAsync()
          .catch((error) => console.error('🔊 Failed to unload arrival alert sound:', error));
        soundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (alert.isVisible && soundRef.current) {
      soundRef.current.replayAsync();
    }
  }, [alert.isVisible]);

  // Don't render if we haven't started rendering yet or animation is complete
  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, {
        transform: [{ translateY: slideAnim }],
        opacity: fadeAnim,
        pointerEvents: alert.isVisible ? 'auto' : 'none',
      }]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={!alert.isVisible}
      >
        <View style={styles.content}>
          <Image
            source={require('@/assets/images/edubus_logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <View style={styles.textContainer}>
            <Text style={styles.title}>The shuttle is approaching</Text>
            <Text style={styles.subtitle}>
              {alert.message || cachedContent.message || ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 38,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 5,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 100,
    height: 100,
  },
  textContainer: {
    flex: 1,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  subtitle: { marginTop: 4, fontSize: 14, color: '#555' },
});