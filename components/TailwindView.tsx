import { View, type ViewProps } from 'react-native';

export type TailwindViewProps = ViewProps & {
  variant?: 'default' | 'container' | 'card' | 'section';
};

export function TailwindView({
  style,
  variant = 'default',
  children,
  className,
  ...rest
}: TailwindViewProps & { className?: string }) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'container':
        return { flex: 1, backgroundColor: '#FFFFFF' };
      case 'card':
        return { 
          backgroundColor: '#FFFFFF', 
          borderRadius: 8, 
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#E5E7EB'
        };
      case 'section':
        return { padding: 16, backgroundColor: '#F9FAFB' };
      default:
        return {};
    }
  };

  const baseStyle = getVariantStyle();

  return (
    <View style={[baseStyle, style]} {...rest}>
      {children}
    </View>
  );
}
