import { createTSEngine } from './tsEngine';

export const chartEngine = createTSEngine('typescript-fallback');

export function createChartEngine() {
  return chartEngine;
}
