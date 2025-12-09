import { userAccountApi } from '@/lib/userAccount/userAccount.api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function useUserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          setAvatarUrl(null);
          setLoading(false);
          return;
        }

        const payload: any = decodeJwtPayload(token);
        const userId: string | undefined =
          payload?.nameid ||
          payload?.sub ||
          payload?.[
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
          ];
        if (!userId) {
          setAvatarUrl(null);
          setLoading(false);
          return;
        }

        const userData = await userAccountApi.getUserById(userId);
        console.log('[useUserAvatar] User data:', {
          userId,
          hasPhotoFileId: !!userData?.userPhotoFileId,
          photoFileId: userData?.userPhotoFileId,
        });
        if (userData?.userPhotoFileId) {
          const avatarUrl = userAccountApi.getAvatarUrl(userId);
          console.log('[useUserAvatar] Avatar URL:', avatarUrl);
          setAvatarUrl(avatarUrl);
        } else {
          console.log('[useUserAvatar] No avatar file ID, showing icon');
          setAvatarUrl(null);
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
        setAvatarUrl(null);
      } finally {
        setLoading(false);
      }
    };

    // Add small delay to avoid blocking initial render
    const timer = setTimeout(() => {
      loadAvatar();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const refreshAvatar = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setAvatarUrl(null);
        return;
      }

      const payload: any = decodeJwtPayload(token);
      const userId: string | undefined =
        payload?.nameid ||
        payload?.sub ||
        payload?.[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
        ];
      if (!userId) {
        setAvatarUrl(null);
        return;
      }

      const userData = await userAccountApi.getUserById(userId);
      if (userData.userPhotoFileId) {
        setAvatarUrl(userAccountApi.getAvatarUrl(userId));
      } else {
        setAvatarUrl(null);
      }
    } catch (error) {
      console.error('Error refreshing avatar:', error);
    }
  };

  return { avatarUrl, loading, refreshAvatar };
}

