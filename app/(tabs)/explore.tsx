import { Image } from 'expo-image';
import { Platform } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { TailwindText } from '@/components/TailwindText';
import { TailwindView } from '@/components/TailwindView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
        />
      }>
      <TailwindView className="flex-row gap-2">
        <TailwindText variant="title">Explore</TailwindText>
      </TailwindView>
      <TailwindText variant="body">This app includes example code to help you get started.</TailwindText>
      <Collapsible title="File-based routing">
        <TailwindText variant="body">
          This app has two screens:{' '}
          <TailwindText variant="body" weight="medium">app/(tabs)/index.tsx</TailwindText> and{' '}
          <TailwindText variant="body" weight="medium">app/(tabs)/explore.tsx</TailwindText>
        </TailwindText>
        <TailwindText variant="body">
          The layout file in <TailwindText variant="body" weight="medium">app/(tabs)/_layout.tsx</TailwindText>{' '}
          sets up the tab navigator.
        </TailwindText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <TailwindText variant="body" className="text-blue-600 dark:text-blue-400">Learn more</TailwindText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS, and web support">
        <TailwindText variant="body">
          You can open this project on Android, iOS, and the web. To open the web version, press{' '}
          <TailwindText variant="body" weight="medium">w</TailwindText> in the terminal running this project.
        </TailwindText>
      </Collapsible>
      <Collapsible title="Images">
        <TailwindText variant="body">
          For static images, you can use the <TailwindText variant="body" weight="medium">@2x</TailwindText> and{' '}
          <TailwindText variant="body" weight="medium">@3x</TailwindText> suffixes to provide files for
          different screen densities
        </TailwindText>
        <Image source={require('@/assets/images/react-logo.png')} className="self-center" />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <TailwindText variant="body" className="text-blue-600 dark:text-blue-400">Learn more</TailwindText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Custom fonts">
        <TailwindText variant="body">
          Open <TailwindText variant="body" weight="medium">app/_layout.tsx</TailwindText> to see how to load{' '}
          <TailwindText variant="body" className="font-roboto-slab">
            custom fonts such as this one.
          </TailwindText>
        </TailwindText>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
          <TailwindText variant="body" className="text-blue-600 dark:text-blue-400">Learn more</TailwindText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Light and dark mode components">
        <TailwindText variant="body">
          This template has light and dark mode support. The{' '}
          <TailwindText variant="body" weight="medium">useColorScheme()</TailwindText> hook lets you inspect
          what the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
        </TailwindText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <TailwindText variant="body" className="text-blue-600 dark:text-blue-400">Learn more</TailwindText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <TailwindText variant="body">
          This template includes an example of an animated component. The{' '}
          <TailwindText variant="body" weight="medium">components/HelloWave.tsx</TailwindText> component uses
          the powerful <TailwindText variant="body" weight="medium">react-native-reanimated</TailwindText>{' '}
          library to create a waving hand animation.
        </TailwindText>
        {Platform.select({
          ios: (
            <TailwindText variant="body">
              The <TailwindText variant="body" weight="medium">components/ParallaxScrollView.tsx</TailwindText>{' '}
              component provides a parallax effect for the header image.
            </TailwindText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}
