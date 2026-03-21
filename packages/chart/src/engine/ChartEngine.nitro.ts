import type { HybridObject } from 'react-native-nitro-modules';

export type NitroPoint = {
  x: number;
  y: number;
};

export type DownsampleInput = {
  points: NitroPoint[];
  threshold: number;
};

export type HitTestInput = {
  points: NitroPoint[];
  targetX: number;
  targetY?: number;
};

export type NearestPointResult = {
  point: NitroPoint | null;
  index: number;
  distance: number;
};

export interface ChartEngineNitro extends HybridObject<{
  ios: 'c++',
  android: 'c++'
}> {
  downsampleSeries(input: DownsampleInput): NitroPoint[];
  findNearestDatum(input: HitTestInput): NearestPointResult;
}
