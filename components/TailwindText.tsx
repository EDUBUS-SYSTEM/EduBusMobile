import { Text, type TextProps } from 'react-native';

export type TailwindTextProps = TextProps & {
  variant?: 'default' | 'title' | 'subtitle' | 'body' | 'caption' | 'button';
  weight?: 'light' | 'regular' | 'medium' | 'bold';
};

export function TailwindText({
  style,
  variant = 'default',
  weight = 'regular',
  children,
  className,
  ...rest
}: TailwindTextProps & { className?: string }) {
  const getFontFamily = () => {
    switch (weight) {
      case 'light':
        return 'RobotoSlab-Light';
      case 'medium':
        return 'RobotoSlab-Medium';
      case 'bold':
        return 'RobotoSlab-Bold';
      default:
        return 'RobotoSlab-Regular';
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'title':
        return { fontSize: 30, lineHeight: 36 };
      case 'subtitle':
        return { fontSize: 20, lineHeight: 28 };
      case 'body':
        return { fontSize: 16, lineHeight: 24 };
      case 'caption':
        return { fontSize: 14, lineHeight: 20 };
      case 'button':
        return { fontSize: 16, lineHeight: 24 };
      default:
        return { fontSize: 16, lineHeight: 24 };
    }
  };

  const baseStyle = {
    fontFamily: getFontFamily(),
    color: '#000000',
    ...getVariantStyle(),
  };

  return (
    <Text style={[baseStyle, style]} {...rest}>
      {children}
    </Text>
  );
}
