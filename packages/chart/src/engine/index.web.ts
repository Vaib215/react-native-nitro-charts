import { createTSEngine } from './tsEngine';

export const chartEngine = createTSEngine('typescript-web');

export function createChartEngine() {
  return chartEngine;
}
