import { IconSymbol } from '@/components/ui/IconSymbol';
import { View } from 'react-native';

export function BackgroundIcons() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {/* Top left - School bus */}
      <View style={{ position: 'absolute', top: 64, left: 32 }}>
        <View style={{
          width: 48,
          height: 48,
          backgroundColor: '#FEED5A',
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.2
        }}>
          <IconSymbol name="bus.fill" size={24} color="#000000" />
        </View>
      </View>

      {/* Top right - Book */}
      <View style={{ position: 'absolute', top: 96, right: 48 }}>
        <View style={{
          width: 40,
          height: 40,
          backgroundColor: '#FEED5A',
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.2
        }}>
          <IconSymbol name="book.fill" size={20} color="#000000" />
        </View>
      </View>

      {/* Middle left - Pencil */}
      <View style={{ position: 'absolute', top: 160, left: 64 }}>
        <View style={{
          width: 32,
          height: 32,
          backgroundColor: '#FEED5A',
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.2
        }}>
          <IconSymbol name="pencil" size={16} color="#000000" />
        </View>
      </View>

      {/* Middle right - Backpack */}
      <View style={{ position: 'absolute', top: 144, right: 32 }}>
        <View style={{
          width: 56,
          height: 56,
          backgroundColor: '#FEED5A',
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.2
        }}>
          <IconSymbol name="bag.fill" size={28} color="#000000" />
        </View>
      </View>

      {/* Bottom left - Graduation cap */}
      <View style={{ position: 'absolute', top: 208, left: 24 }}>
        <View style={{
          width: 40,
          height: 40,
          backgroundColor: '#FEED5A',
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.2
        }}>
          <IconSymbol name="graduationcap.fill" size={20} color="#000000" />
        </View>
      </View>

      {/* Bottom right - School bus */}
      <View style={{ position: 'absolute', top: 192, right: 80 }}>
        <View style={{
          width: 48,
          height: 48,
          backgroundColor: '#FEED5A',
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.2
        }}>
          <IconSymbol name="bus.fill" size={24} color="#000000" />
        </View>
      </View>

      {/* Additional decorative circles */}
      <View style={{ position: 'absolute', top: 80, left: '50%' }}>
        <View style={{
          width: 24,
          height: 24,
          backgroundColor: '#FEED5A',
          borderRadius: 12,
          opacity: 0.15
        }} />
      </View>

      <View style={{ position: 'absolute', top: 128, right: '33%' }}>
        <View style={{
          width: 16,
          height: 16,
          backgroundColor: '#FEED5A',
          borderRadius: 8,
          opacity: 0.15
        }} />
      </View>

      <View style={{ position: 'absolute', top: 176, left: '33%' }}>
        <View style={{
          width: 32,
          height: 32,
          backgroundColor: '#FEED5A',
          borderRadius: 16,
          opacity: 0.15
        }} />
      </View>
    </View>
  );
}
