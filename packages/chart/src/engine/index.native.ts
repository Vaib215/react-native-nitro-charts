import { NitroModules } from 'react-native-nitro-modules';

import type { ChartEngine } from '../types';
import type { ChartEngineNitro, DownsampleInput, HitTestInput } from './ChartEngine.nitro';
import { createTSEngine } from './tsEngine';

const fallbackEngine = createTSEngine('typescript-fallback');

export function createChartEngine(): ChartEngine {
  try {
    const nativeEngine = NitroModules.createHybridObject<ChartEngineNitro>('ChartEngineNitro');
    return {
      name: 'native-nitro',
      downsampleSeries(input) {
        return nativeEngine.downsampleSeries(input as DownsampleInput);
      },
      findNearestDatum(input) {
        return nativeEngine.findNearestDatum(input as HitTestInput);
      },
    };
  } catch {
    return fallbackEngine;
  }
}

export const chartEngine = createChartEngine();
