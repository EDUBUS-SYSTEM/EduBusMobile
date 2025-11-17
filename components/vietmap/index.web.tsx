import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

type MapViewProps = {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  // Accept any other props used in native screens but ignore them on web
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export const MapView: React.FC<MapViewProps> = ({ style, children }) => {
  return (
    <View style={[styles.mapPlaceholder, style]}>
      <Text style={styles.title}>Map is not available on web preview</Text>
      <Text style={styles.subtitle}>
        Vietmap native map is only supported on mobile (Android/iOS).{' '}
        This is a placeholder so that the rest of the app can run on web.
      </Text>
      {children ? null : null}
    </View>
  );
};

// The following components are no-ops on web, they just render children if any
type GenericProps = {
  children?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export const Camera: React.FC<GenericProps> = () => null;

export const LineLayer: React.FC<GenericProps> = ({ children }) => <>{children}</>;

export const ShapeSource: React.FC<GenericProps> = ({ children }) => <>{children}</>;

export const PointAnnotation: React.FC<GenericProps> = ({ children }) => <>{children}</>;

// On web we don't need a real MapViewRef, so just alias to any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MapViewRef = any;

const styles = StyleSheet.create({
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});



