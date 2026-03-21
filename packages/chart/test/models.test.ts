import { describe, expect, test } from 'bun:test';

import { computeBarGeometry, computeDonutGeometry, computeLineGeometry, findNearestPoint } from '../src/headless/models';
import { minMaxDownsample } from '../src/engine/tsEngine';

describe('headless models', () => {
  test('computes line geometry', () => {
    const geometry = computeLineGeometry({
      data: [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 2 },
      ],
      xKey: 'x',
      yKey: 'y',
      width: 300,
      height: 200,
    });

    expect(geometry.path.length).toBeGreaterThan(0);
    expect(geometry.points).toHaveLength(3);
  });

  test('computes bars', () => {
    const geometry = computeBarGeometry({
      data: [
        { label: 'A', value: 10 },
        { label: 'B', value: 20 },
      ],
      categoryKey: 'label',
      valueKey: 'value',
      width: 300,
      height: 160,
    });

    expect(geometry).toHaveLength(2);
    expect(geometry[0].width).toBeGreaterThan(0);
  });

  test('computes donut slices', () => {
    const slices = computeDonutGeometry({
      data: [
        { label: 'A', value: 10, color: '#000' },
        { label: 'B', value: 20, color: '#fff' },
      ],
      width: 240,
      height: 240,
    });

    expect(slices).toHaveLength(2);
    expect(slices[0].path.length).toBeGreaterThan(0);
  });

  test('downsamples and hit-tests', () => {
    const points = Array.from({ length: 100 }, (_, index) => ({ x: index, y: Math.sin(index) }));
    const sampled = minMaxDownsample({ points, threshold: 20 });
    const nearest = findNearestPoint(sampled, sampled[0].x, sampled[0].y);

    expect(sampled.length).toBeLessThanOrEqual(40);
    expect(nearest.index).toBeGreaterThanOrEqual(0);
  });
});
