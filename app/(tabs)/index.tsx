import { Image } from 'expo-image';
import { Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { TailwindText } from '@/components/TailwindText';
import { TailwindView } from '@/components/TailwindView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          className="h-44 w-72 bottom-0 left-0 absolute"
        />
      }>
      <TailwindView className="flex-row items-center gap-2">
        <TailwindText variant="title">Welcome!</TailwindText>
        <HelloWave />
      </TailwindView>
      <TailwindView className="gap-2 mb-2">
        <TailwindText variant="subtitle">Step 1: Try it</TailwindText>
        <TailwindText variant="body">
          Edit <TailwindText variant="body" weight="medium">app/(tabs)/index.tsx</TailwindText> to see changes.
          Press{' '}
          <TailwindText variant="body" weight="medium">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </TailwindText>{' '}
          to open developer tools.
        </TailwindText>
      </TailwindView>
      <TailwindView className="gap-2 mb-2">
        <TailwindText variant="subtitle">Step 2: Explore</TailwindText>
        <TailwindText variant="body">
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </TailwindText>
      </TailwindView>
      <TailwindView className="gap-2 mb-2">
        <TailwindText variant="subtitle">Step 3: Get a fresh start</TailwindText>
        <TailwindText variant="body">
          {`When you're ready, run `}
          <TailwindText variant="body" weight="medium">npm run reset-project</TailwindText> to get a fresh{' '}
          <TailwindText variant="body" weight="medium">app</TailwindText> directory. This will move the current{' '}
          <TailwindText variant="body" weight="medium">app</TailwindText> to{' '}
          <TailwindText variant="body" weight="medium">app-example</TailwindText>.
        </TailwindText>
      </TailwindView>
    </ParallaxScrollView>
  );
}
