# Tailwind CSS Setup with Roboto Slab Font

This project is configured with Tailwind CSS and the Roboto Slab font.

## Completed Configuration

### 1. Installed Dependencies
- `nativewind`: Tailwind CSS for React Native
- `tailwindcss`: CSS framework
- `react-native-svg`: SVG support

### 2. Roboto Slab Font
The fonts have been loaded and configured:
- `RobotoSlab-Regular.ttf`
- `RobotoSlab-Light.ttf`
- `RobotoSlab-Medium.ttf`
- `RobotoSlab-Bold.ttf`

### 3. New Components
- `TailwindText`: Text component with Tailwind CSS and Roboto Slab font
- `TailwindView`: View component with Tailwind CSS

## Usage

### Using TailwindText
```tsx
import { TailwindText } from '@/components/TailwindText';

// Available variants: 'default', 'title', 'subtitle', 'body', 'caption', 'button'
// Available weights: 'light', 'regular', 'medium', 'bold'

<TailwindText variant="title">Main Title</TailwindText>
<TailwindText variant="subtitle" weight="medium">Subtitle</TailwindText>
<TailwindText variant="body">Body text</TailwindText>
<TailwindText variant="caption" weight="light">Small caption</TailwindText>
```

### Using TailwindView
```tsx
import { TailwindView } from '@/components/TailwindView';

// Available variants: 'default', 'container', 'card', 'section'

<TailwindView variant="container" className="p-4">
  <TailwindText>Content</TailwindText>
</TailwindView>

<TailwindView variant="card" className="m-4">
  <TailwindText>Card content</TailwindText>
</TailwindView>
```

### Using Tailwind CSS directly
```tsx
import { styled } from 'nativewind';
import { View, Text } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);

<StyledView className="flex-1 bg-white dark:bg-gray-900 p-4">
  <StyledText className="text-lg font-roboto-slab text-gray-900 dark:text-gray-100">
    Hello World
  </StyledText>
</StyledView>
```

## Available Font Classes
- `font-roboto-slab`: Roboto Slab Regular
- `font-roboto-slab-light`: Roboto Slab Light
- `font-roboto-slab-medium`: Roboto Slab Medium
- `font-roboto-slab-bold`: Roboto Slab Bold

## Run the project
```bash
npm start
```

## Notes
- Ensure the Metro bundler is restarted after configuration changes
- Fonts will be loaded automatically when the app starts
- Dark mode is automatically supported with the `dark:` classes
