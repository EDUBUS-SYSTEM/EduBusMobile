import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { hideCurrentAlert, showNextAlert } from '../../store/slices/notificationAlertSlice';
import { markNotificationAsRead } from '../../store/slices/notificationsSlice';

export const NotificationAlert = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { current, isVisible, totalInQueue } = useAppSelector(state => state.notificationAlert);

  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const [cachedContent, setCachedContent] = useState<{ notificationId?: string; title?: string; message?: string; tripId?: string }>({});
  const isHidingRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Debug: Log alert state changes
  useEffect(() => {
    console.log('🔔 NotificationAlert state:', {
      isVisible,
      current,
      totalInQueue,
    });
  }, [isVisible, current, totalInQueue]);

  // Handle button press - defined before early return to follow Rules of Hooks
  const handlePress = useCallback(() => {
    const notificationId = current?.notificationId || cachedContent.notificationId;
    const tripId = current?.tripId || cachedContent.tripId;

    // Mark notification as read
    if (notificationId) {
      dispatch(markNotificationAsRead(notificationId));
    }

    // Navigate to trip detail
    if (tripId) router.push(`/(parent-tabs)/trip/${tripId}`);

    // Hide current alert
    dispatch(hideCurrentAlert());
  }, [current, cachedContent, router, dispatch]);

  // Track when alert becomes visible to start rendering and cache content
  useEffect(() => {
    if (isVisible && current) {
      setShouldRender(true);
      // Cache the content so it persists during hide animation
      setCachedContent({
        notificationId: current.notificationId,
        title: current.title,
        message: current.message,
        tripId: current.tripId,
      });
    }
  }, [isVisible, current]);

  // Animation effect when alert shows/hides
  useEffect(() => {
    if (isVisible) {
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
      // Hide animation: slide up + fade out (faster when queue has items)
      isHidingRef.current = true;
      const animDuration = totalInQueue > 1 ? 600 : 1000;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: animDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: animDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After animation completes, show next alert or unmount
        setShouldRender(false);
        setCachedContent({});
        isHidingRef.current = false;
        // Trigger next alert in queue
        dispatch(showNextAlert());
      });
    }
  }, [isVisible, shouldRender, slideAnim, fadeAnim, totalInQueue, dispatch]);

  // Auto-hide alert - dynamic duration based on queue
  useEffect(() => {
    if (isVisible) {
      // Shorter duration when processing queue, longer when it's the only notification
      const duration = totalInQueue > 1 ? 6000 : 10000;
      const timer = setTimeout(() => {
        dispatch(hideCurrentAlert());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, totalInQueue, dispatch]);

  useEffect(() => {
    let isMounted = true;

    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/notification-sound.mp3')
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
    if (isVisible && soundRef.current) {
      soundRef.current.replayAsync();
    }
  }, [isVisible]);

  // Don't render if we haven't started rendering yet or animation is complete
  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, {
        transform: [{ translateY: slideAnim }],
        opacity: fadeAnim,
        pointerEvents: isVisible ? 'auto' : 'none',
      }]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={!isVisible}
      >
        <View style={styles.content}>
          <Image
            source={require('@/assets/images/edubus_logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{current?.title || cachedContent.title}</Text>
            <Text style={styles.subtitle}>
              {current?.message || cachedContent.message || ''}
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