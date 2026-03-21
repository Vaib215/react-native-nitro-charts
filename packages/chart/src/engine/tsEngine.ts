import type { ChartEngine, DatumPoint, DownsampleInput, HitTestInput, NearestPointResult } from '../types';

function distance(a: DatumPoint, targetX: number, targetY?: number): number {
  const dx = a.x - targetX;
  const dy = targetY == null ? 0 : a.y - targetY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function minMaxDownsample(input: DownsampleInput): DatumPoint[] {
  const { points, threshold } = input;
  if (threshold <= 0 || points.length <= threshold) {
    return points;
  }

  const bucketSize = Math.max(1, Math.floor(points.length / threshold));
  const output: DatumPoint[] = [];

  for (let bucketStart = 0; bucketStart < points.length; bucketStart += bucketSize) {
    const bucket = points.slice(bucketStart, bucketStart + bucketSize);
    if (bucket.length === 0) {
      continue;
    }

    let minPoint = bucket[0];
    let maxPoint = bucket[0];

    for (const point of bucket) {
      if (point.y < minPoint.y) {
        minPoint = point;
      }
      if (point.y > maxPoint.y) {
        maxPoint = point;
      }
    }

    output.push(minPoint);
    if (maxPoint !== minPoint) {
      output.push(maxPoint);
    }
  }

  output.sort((a, b) => a.x - b.x);
  return output;
}

export function nearestPoint(input: HitTestInput): NearestPointResult {
  const { points, targetX, targetY } = input;
  if (points.length === 0) {
    return { point: null, index: -1, distance: Number.POSITIVE_INFINITY };
  }

  let bestPoint = points[0];
  let bestIndex = 0;
  let bestDistance = distance(points[0], targetX, targetY);

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const currentDistance = distance(point, targetX, targetY);
    if (currentDistance < bestDistance) {
      bestPoint = point;
      bestIndex = index;
      bestDistance = currentDistance;
    }
  }

  return { point: bestPoint, index: bestIndex, distance: bestDistance };
}

export function createTSEngine(name: ChartEngine['name']): ChartEngine {
  return {
    name,
    downsampleSeries(input: DownsampleInput) {
      return minMaxDownsample(input);
    },
    findNearestDatum(input: HitTestInput) {
      return nearestPoint(input);
    },
  };
}
