import { DEFAULT_PADDING } from '../constants';
import type { ChartPadding } from '../types';

export function resolvePadding(padding?: Partial<ChartPadding>): ChartPadding {
  return {
    top: padding?.top ?? DEFAULT_PADDING.top,
    right: padding?.right ?? DEFAULT_PADDING.right,
    bottom: padding?.bottom ?? DEFAULT_PADDING.bottom,
    left: padding?.left ?? DEFAULT_PADDING.left,
  };
}
