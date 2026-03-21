import type { ColorValue } from 'react-native';

export function toSkiaColor(color: ColorValue | undefined, fallback: string) {
  return typeof color === 'string' ? color : fallback;
}
