import { authApi } from '@/lib/auth/auth.api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

type UserRole = 'Parent' | 'Driver' | 'Supervisor' | null;
type AppRole = Exclude<UserRole, null>;

const DEFAULT_ROUTE = '/help-parent';

const ROLE_ROUTE_MAP: Record<AppRole, string> = {
  Driver: '/help-driver',
  Supervisor: '/help-supervisor',
  Parent: '/help-parent',
};

export default function HelpScreen() {
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const info = await authApi.getUserInfo();
        const route = info.role && ROLE_ROUTE_MAP[info.role as AppRole]
          ? ROLE_ROUTE_MAP[info.role as AppRole]
          : DEFAULT_ROUTE;
        if (mounted) {
          router.replace(route as any);
        }
      } catch {
        if (mounted) {
          router.replace(DEFAULT_ROUTE as any);
        }
      } finally {
        if (mounted) {
          setResolved(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
      {resolved ? null : <ActivityIndicator size="large" color="#01CBCA" />}
    </View>
  );
}

