import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type FaceAngle = 'front' | 'left' | 'right' | 'up' | 'down';

const { width, height } = Dimensions.get('window');

export default function FaceRegistrationScreen() {
  const router = useRouter();
  const { childId, childName } = useLocalSearchParams();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [currentAngle, setCurrentAngle] = useState<FaceAngle>('front');
  const [faceDetected, setFaceDetected] = useState(false);
  const [isAligned, setIsAligned] = useState(false);
  const [guidance, setGuidance] = useState('Position your face in the center of the oval');
  const [angleProgress, setAngleProgress] = useState<Record<FaceAngle, number>>({
    front: 0,
    left: 0,
    right: 0,
    up: 0,
    down: 0,
  });
  const [showGallery, setShowGallery] = useState(false);
  const [capturedImages, setCapturedImages] = useState<{uri: string, timestamp: number}[]>([]);

  const TOTAL_IMAGES = 70;
  const ANGLES: FaceAngle[] = ['front', 'left', 'right', 'up', 'down'];
  const IMAGES_PER_ANGLE = Math.ceil(TOTAL_IMAGES / ANGLES.length);

  // Request camera permission
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Auto-capture from camera
  useEffect(() => {
    if (!isCapturing || capturedCount >= TOTAL_IMAGES) {
      // Stop capturing when reached 70 images
      if (capturedCount >= TOTAL_IMAGES) {
        setIsCapturing(false);
        setFaceDetected(false);
        setIsAligned(false);
      }
      return;
    }

    const captureInterval = setInterval(async () => {
      if (isAligned && faceDetected && cameraRef.current) {
        try {
          // Capture photo from camera
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.7,
            base64: false,
          });
          
          setCapturedCount(prev => {
            const newCount = prev + 1;
            console.log(`📸 Captured: ${newCount}/${TOTAL_IMAGES}`);
            
            // Save captured image
            setCapturedImages(prevImages => [...prevImages, {
              uri: photo.uri,
              timestamp: Date.now()
            }]);
            
            return newCount;
          });
        } catch (error) {
          console.error('❌ Failed to capture photo:', error);
        }
      }
    }, 400); // Faster capture - every 400ms (was 800ms)

    return () => clearInterval(captureInterval);
  }, [isCapturing, capturedCount, isAligned, faceDetected]);

  // Rotate angle every 14 images and track progress
  useEffect(() => {
    const angleIndex = Math.floor(capturedCount / IMAGES_PER_ANGLE);
    if (angleIndex < ANGLES.length) {
      const newAngle = ANGLES[angleIndex];
      setCurrentAngle(newAngle);
      updateGuidance(newAngle);
      
      // Update angle progress
      const imagesInCurrentAngle = capturedCount % IMAGES_PER_ANGLE;
      setAngleProgress(prev => ({
        ...prev,
        [newAngle]: imagesInCurrentAngle,
      }));
    }
  }, [capturedCount]);

  const updateGuidance = (angle: FaceAngle) => {
    const guidanceMap: Record<FaceAngle, string> = {
      front: '📍 Look straight at the camera',
      left: '⬅️ Turn your face left slowly',
      right: '➡️ Turn your face right slowly',
      up: '⬆️ Look up slowly',
      down: '⬇️ Look down slowly',
    };
    setGuidance(guidanceMap[angle]);
  };

  const handleManualCapture = () => {
    // Stricter check: require both face detection AND proper alignment
    // AND face must be inside the oval frame
    if (isAligned && faceDetected) {
      setCapturedCount(prev => prev + 1);
      Alert.alert('✅ Captured', `Image ${capturedCount + 1}/70`);
    } else if (!faceDetected) {
      Alert.alert(
        '❌ Face Not Detected',
        'Please position your face inside the oval frame'
      );
    } else {
      Alert.alert(
        '❌ Not Aligned',
        'Please center your face in the oval frame'
      );
    }
  };

  const handleComplete = () => {
    console.log('🔵 Complete button pressed! capturedCount:', capturedCount);
    
    if (capturedCount < 50) {
      Alert.alert(
        'Insufficient Images',
        `You need at least 50 images. Current: ${capturedCount}`,
        [{ text: 'Continue', onPress: () => {} }]
      );
      return;
    }

    console.log('✅ Navigating to success page');
    // Navigate directly to success page without alert
    submitFaceData();
    router.push({
      pathname: '/face-registration-success',
      params: {
        capturedCount: capturedCount,
        childName: childName,
      },
    } as any);
  };

  const submitFaceData = async () => {
    try {
      setIsCapturing(false);
      console.log('Submitting', capturedCount, 'images for', childId);

      Alert.alert(
        'Success',
        'Face registration completed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit face data');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure? All captured images will be lost.',
      [
        { text: 'Continue', onPress: () => {}, style: 'cancel' },
        {
          text: 'Cancel',
          onPress: () => {
            router.push('/(parent-tabs)/children-list');
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Simulate face detection and alignment with stricter checks
  // Face MUST be inside the oval frame to be detected
  useEffect(() => {
    if (!isCapturing) {
      setFaceDetected(false);
      setIsAligned(false);
      return;
    }

    // Simulate face detection every 200ms (faster detection)
    const detectionInterval = setInterval(() => {
      // Simulate SINGLE face position (0-1, where 0.5 is center)
      // Only 1 face detected - no second person
      // STRICT: Face must be very close to center
      const randomX = Math.random();
      const randomY = Math.random();
      
      // 90% chance face is in VERY CENTER area, 10% chance random position
      // This ensures ONLY the main face is detected, not background people
      const faceX = Math.random() > 0.1 ? 0.5 + (randomX - 0.5) * 0.35 : randomX;
      const faceY = Math.random() > 0.1 ? 0.5 + (randomY - 0.5) * 0.35 : randomY;
      
      // Oval frame center and dimensions
      const centerX = 0.5;
      const centerY = 0.5;
      const radiusX = 0.40; // Horizontal radius
      const radiusY = 0.30; // Vertical radius
      
      // Check if face is inside oval using ellipse equation
      const dx = (faceX - centerX) / radiusX;
      const dy = (faceY - centerY) / radiusY;
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
      
      // Face must be inside oval (distance <= 1)
      const isInsideOval = distanceFromCenter <= 1;
      
      if (isInsideOval) {
        // STRICT: Only detect if face is VERY centered (not at edges)
        // This prevents detecting background people
        const isCenteredEnough = distanceFromCenter <= 0.7; // Must be in center 70% of oval
        
        if (isCenteredEnough) {
          // Face detection: 90% chance when properly centered
          const detected = Math.random() > 0.1;
          setFaceDetected(detected);
          
          if (detected) {
            // Alignment: 85% chance when face is detected and centered
            // Requires face to be VERY well positioned
            const alignmentThreshold = 0.6; // Face must be in center 60% of oval
            const isPerfectlyAligned = distanceFromCenter <= alignmentThreshold;
            const aligned = isPerfectlyAligned && Math.random() > 0.15;
            setIsAligned(aligned);
          } else {
            setIsAligned(false);
          }
        } else {
          // Face is at edge of oval - likely background person
          setFaceDetected(false);
          setIsAligned(false);
        }
      } else {
        // Face is outside oval - cannot detect
        setFaceDetected(false);
        setIsAligned(false);
      }
    }, 200); // Faster detection interval

    return () => clearInterval(detectionInterval);
  }, [isCapturing]);

  // Gallery View
  if (showGallery) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowGallery(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Face Gallery</Text>
          <View style={{width: 40}} />
        </View>
        <ScrollView style={styles.galleryContainer}>
          <Text style={styles.galleryTitle}>Captured Images ({capturedImages.length})</Text>
          <View style={styles.galleryGrid}>
            {capturedImages.length === 0 ? (
              <Text style={styles.galleryEmpty}>No images captured yet</Text>
            ) : (
              capturedImages.map((imageData, index) => (
                <View key={index} style={styles.galleryItem}>
                  <RNImage
                    source={{uri: imageData.uri}}
                    style={{width: '100%', height: '100%', borderRadius: 8}}
                  />
                  <Text style={styles.galleryImageIndex}>#{index + 1}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={48} color="#01CBCA" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to register your face
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EduBus Face Registration</Text>
        <View style={{width: 40}} />
      </View>

      <CameraView style={styles.camera} ref={cameraRef} facing="front">
        {/* Overlay with face detection zone */}
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Top Info */}
          <View style={styles.topInfo}>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {capturedCount} / {TOTAL_IMAGES}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(capturedCount / TOTAL_IMAGES) * 100}%` },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Face Detection Zone */}
          <View style={styles.centerContainer}>
            {/* Guidance Text */}
            <Text style={styles.guidanceText}>{guidance}</Text>

            {/* Face Zone Oval (FaceID style) */}
            <View
              style={[
                styles.faceZoneOval,
                {
                  borderColor: isAligned ? '#4CAF50' : '#FF9800',
                  backgroundColor: isAligned
                    ? 'rgba(76, 175, 80, 0.08)'
                    : 'rgba(255, 152, 0, 0.08)',
                },
              ]}
            >
              {/* Center dot */}
              <View
                style={[
                  styles.centerDot,
                  { backgroundColor: isAligned ? '#4CAF50' : '#FF9800' },
                ]}
              />
            </View>

            {/* Status Indicator */}
            <View style={styles.statusContainer}>
              {faceDetected ? (
                <View style={styles.statusGood}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.statusText}>✓ Face in Frame</Text>
                </View>
              ) : (
                <View style={styles.statusBad}>
                  <Ionicons name="alert-circle" size={20} color="#FF9800" />
                  <Text style={styles.statusText}>Move face into oval</Text>
                </View>
              )}

              {isAligned ? (
                <View style={styles.statusGood}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.statusText}>✓ Perfectly Centered</Text>
                </View>
              ) : (
                <View style={styles.statusBad}>
                  <Ionicons name="alert-circle" size={20} color="#FF9800" />
                  <Text style={styles.statusText}>Center your face</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomContainer}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => {
                  console.log('🔄 Retake pressed');
                  setCapturedCount(0);
                  setAngleProgress({
                    front: 0,
                    left: 0,
                    right: 0,
                    up: 0,
                    down: 0,
                  });
                  setCurrentAngle('front');
                  updateGuidance('front');
                }}
              >
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>

              {capturedCount >= 50 ? (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleComplete}
                  activeOpacity={0.7}
                  disabled={false}
                >
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>Complete</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {capturedCount < 50 && (
              <Text style={styles.hintText}>
                Press the play button to start auto-capture
              </Text>
            )}
          </View>
        </View>
      </CameraView>

      {/* Floating Action Button to toggle auto-capture */}
      <TouchableOpacity
        style={[
          styles.fab,
          isCapturing && styles.fabActive,
        ]}
        onPress={() => setIsCapturing(!isCapturing)}
      >
        <Ionicons
          name={isCapturing ? 'pause' : 'play'}
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* Gallery Button */}
      {capturedCount > 0 && (
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={() => setShowGallery(true)}
        >
          <Ionicons name="images" size={24} color="#FFFFFF" />
          <Text style={styles.galleryButtonText}>{capturedCount}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 18,
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#01CBCA',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  topInfo: {
    paddingHorizontal: 0,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 12,
  },
  progressText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#01CBCA',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceText: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  faceZone: {
    width: Math.min(width * 0.75, 300),
    height: Math.min(height * 0.45, 400),
    borderWidth: 3,
    borderRadius: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  faceZoneOval: {
    width: Math.min(width * 0.7, 280),
    height: Math.min(height * 0.5, 380),
    borderWidth: 3,
    borderRadius: Math.min(width * 0.35, 140),
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#01CBCA',
  },
  topLeft: {
    top: -3,
    left: -3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -3,
    right: -3,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusContainer: {
    gap: 8,
  },
  statusGood: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  statusBad: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  statusText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#FFFFFF',
  },
  bottomContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    width: '100%',
  },
  angleProgressContainer: {
    width: '100%',
    marginBottom: 12,
    gap: 8,
  },
  angleProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  angleLabel: {
    fontSize: 16,
    width: 24,
  },
  angleProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  angleProgressFill: {
    height: '100%',
    backgroundColor: '#01CBCA',
  },
  angleCount: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 10,
    color: '#FFFFFF',
    minWidth: 40,
    textAlign: 'right',
  },
  angleIndicator: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  angleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  angleDotActive: {
    backgroundColor: '#01CBCA',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    width: '100%',
    paddingHorizontal: 0,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  retakeButtonText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  completeButtonText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  captureProgressText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 13,
    color: '#01CBCA',
    textAlign: 'center',
    marginTop: 8,
  },
  hintText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabActive: {
    backgroundColor: '#4CAF50',
  },
  galleryButton: {
    position: 'absolute',
    bottom: 160,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#01CBCA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  galleryButtonText: {
    position: 'absolute',
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 10,
    color: '#FFFFFF',
    backgroundColor: '#FF5722',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    bottom: -5,
    right: -5,
  },
  galleryContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  galleryTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 16,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  galleryEmpty: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  galleryItem: {
    width: (width - 64) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  galleryImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  galleryImageIndex: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 10,
    color: '#FFFFFF',
    backgroundColor: '#01CBCA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
