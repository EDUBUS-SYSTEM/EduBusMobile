import { IconSymbol } from '@/components/ui/IconSymbol';
import { TextInput, View, type TextInputProps } from 'react-native';

export type TailwindInputProps = TextInputProps & {
  icon?: 'person' | 'lock' | 'search' | 'key';
  placeholder: string;
};

export function TailwindInput({
  icon,
  placeholder,
  style,
  ...rest
}: TailwindInputProps) {
  const getIconName = () => {
    switch (icon) {
      case 'person':
        return 'person.fill';
      case 'lock':
        return 'lock.fill';
      case 'search':
        return 'magnifyingglass';
      case 'key':
        return 'key.fill';
      default:
        return 'person.fill';
    }
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16
    }}>
      {icon && (
        <View style={{ marginRight: 12 }}>
          <IconSymbol
            name={getIconName()}
            size={20}
            color="#929191"
          />
        </View>
      )}
      <TextInput
        style={[
          {
            flex: 1,
            fontSize: 16,
            fontFamily: 'RobotoSlab-Regular',
            color: '#000000',
          },
          style
        ]}
        placeholder={placeholder}
        placeholderTextColor="#929191"
        {...rest}
      />
    </View>
  );
}
