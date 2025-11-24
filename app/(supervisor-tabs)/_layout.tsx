import { authApi } from '@/lib/auth/auth.api';
import TabBarSupervisor from '@/navigation/TabBarSupervisor';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function SupervisorTabsLayout() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const userInfo = await authApi.getUserInfo();
        if (!mounted) {
          return;
        }

        if (userInfo.role === 'Supervisor') {
          setAuthorized(true);
        } else if (userInfo.role === 'Driver') {
          router.replace('/(driver-tabs)/dashboard' as any);
        } else if (userInfo.role === 'Parent') {
          router.replace('/(parent-tabs)/home' as any);
        } else {
          router.replace('/login' as any);
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#01CBCA" />
      </View>
    );
  }

  if (!authorized) {
    return null;
  }

  return <TabBarSupervisor />;
}

