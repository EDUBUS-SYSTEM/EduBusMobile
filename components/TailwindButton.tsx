import { Text, TouchableOpacity, type TouchableOpacityProps } from 'react-native';

export type TailwindButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'secondary';
};

export function TailwindButton({
  title,
  variant = 'primary',
  style,
  ...rest
}: TailwindButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#01CBCA',
          borderRadius: 8,
          paddingVertical: 16,
          paddingHorizontal: 24,
        };
      case 'secondary':
        return {
          backgroundColor: '#E5E7EB',
          borderRadius: 8,
          paddingVertical: 16,
          paddingHorizontal: 24,
        };
      default:
        return {
          backgroundColor: '#01CBCA',
          borderRadius: 8,
          paddingVertical: 16,
          paddingHorizontal: 24,
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          color: '#FFFFFF',
          fontFamily: 'RobotoSlab-Bold',
          textAlign: 'center',
          fontSize: 18,
        };
      case 'secondary':
        return {
          color: '#374151',
          fontFamily: 'RobotoSlab-Medium',
          textAlign: 'center',
          fontSize: 18,
        };
      default:
        return {
          color: '#FFFFFF',
          fontFamily: 'RobotoSlab-Bold',
          textAlign: 'center',
          fontSize: 18,
        };
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
      {...rest}
    >
      <Text style={getTextStyle()}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
