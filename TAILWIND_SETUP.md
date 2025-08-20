# Tailwind CSS Setup với Font Roboto Slab

Dự án này đã được cấu hình với Tailwind CSS và font Roboto Slab.

## Cấu hình đã hoàn thành

### 1. Dependencies đã cài đặt
- `nativewind`: Tailwind CSS cho React Native
- `tailwindcss`: Framework CSS
- `react-native-svg`: Hỗ trợ SVG

### 2. Font Roboto Slab
Các font đã được tải và cấu hình:
- `RobotoSlab-Regular.ttf`
- `RobotoSlab-Light.ttf`
- `RobotoSlab-Medium.ttf`
- `RobotoSlab-Bold.ttf`

### 3. Components mới
- `TailwindText`: Component Text với Tailwind CSS và font Roboto Slab
- `TailwindView`: Component View với Tailwind CSS

## Cách sử dụng

### Sử dụng TailwindText
```tsx
import { TailwindText } from '@/components/TailwindText';

// Các variant có sẵn: 'default', 'title', 'subtitle', 'body', 'caption', 'button'
// Các weight có sẵn: 'light', 'regular', 'medium', 'bold'

<TailwindText variant="title">Tiêu đề lớn</TailwindText>
<TailwindText variant="subtitle" weight="medium">Tiêu đề phụ</TailwindText>
<TailwindText variant="body">Nội dung văn bản</TailwindText>
<TailwindText variant="caption" weight="light">Chú thích nhỏ</TailwindText>
```

### Sử dụng TailwindView
```tsx
import { TailwindView } from '@/components/TailwindView';

// Các variant có sẵn: 'default', 'container', 'card', 'section'

<TailwindView variant="container" className="p-4">
  <TailwindText>Nội dung</TailwindText>
</TailwindView>

<TailwindView variant="card" className="m-4">
  <TailwindText>Card content</TailwindText>
</TailwindView>
```

### Sử dụng Tailwind CSS trực tiếp
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

## Font Classes có sẵn
- `font-roboto-slab`: Roboto Slab Regular
- `font-roboto-slab-light`: Roboto Slab Light
- `font-roboto-slab-medium`: Roboto Slab Medium
- `font-roboto-slab-bold`: Roboto Slab Bold

## Chạy dự án
```bash
npm start
```

## Lưu ý
- Đảm bảo Metro bundler được restart sau khi thay đổi cấu hình
- Font sẽ được load tự động khi app khởi động
- Dark mode được hỗ trợ tự động với các class `dark:`
