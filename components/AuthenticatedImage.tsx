import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

interface AuthenticatedImageProps {
  uri?: string | null;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  fallbackColor?: string;
  fallbackInitials?: string;
  size?: number;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function AuthenticatedImage({
  uri,
  fallbackIcon = 'person',
  fallbackColor = '#01CBCA',
  fallbackInitials,
  size = 70,
  style,
  contentFit = 'cover',
}: AuthenticatedImageProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Load token once
  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
    });
  }, []);

  // Load image when token is available
  useEffect(() => {
    if (!token || !uri) {
      setError(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let cancelled = false;
    let downloadedFileUri: string | null = null;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);


        // Generate a unique filename based on the full URI to avoid cache conflicts
        // Use a hash of the full URI to ensure uniqueness for different students/users
        const uriHash = uri.split('').reduce((acc, char) => {
          const hash = ((acc << 5) - acc) + char.charCodeAt(0);
          return hash & hash;
        }, 0).toString(36);
        const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
        const fileUri = `${cacheDir}avatar_${uriHash}_${Date.now()}.jpg`;

        // Download image with authentication using expo-file-system
        const downloadResult = await FileSystem.downloadAsync(
          uri,
          fileUri,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (cancelled || !isMounted) {
          // Clean up downloaded file if component unmounted
          if (downloadResult.uri) {
            await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
          }
          return;
        }

        if (downloadResult.status !== 200) {
          if (isMounted && !cancelled) {
            setError(true);
            setLoading(false);
          }
          return;
        }

        downloadedFileUri = downloadResult.uri;
        setImageUri(downloadResult.uri);
        setLoading(false);
      } catch {
        if (isMounted && !cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      cancelled = true;
      isMounted = false;

      // Clean up downloaded file when component unmounts
      if (downloadedFileUri) {
        FileSystem.deleteAsync(downloadedFileUri, { idempotent: true }).catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, [uri, token]);

  // Show fallback (initials or icon) if error or no image
  if (error || !imageUri || loading) {
    if (fallbackInitials) {
      return (
        <View style={[style, { width: size, height: size, borderRadius: size / 2, backgroundColor: fallbackColor, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: size * 0.35, textAlign: 'center' }}>
            {fallbackInitials}
          </Text>
        </View>
      );
    }
    return (
      <Ionicons name={fallbackIcon} size={size * 0.5} color={fallbackColor} />
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      contentFit={contentFit}
      onError={() => {
        setError(true);
      }}
    />
  );
}

