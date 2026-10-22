import type { ComponentProps } from 'react';
import { Platform } from 'react-native';
import { Skeleton } from 'heroui-native';

// Web theme colors are not supported by the shimmer's HSV conversion.
// Pulse keeps the same themed placeholders without that conversion path.
export function LoadingSkeleton(props: ComponentProps<typeof Skeleton>) {
  return <Skeleton {...props} variant={Platform.OS === 'web' ? 'pulse' : props.variant} />;
}
