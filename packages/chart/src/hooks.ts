import React from 'react';

import { computeAreaGeometry, computeBarGeometry, computeDonutGeometry, computeLineGeometry, findNearestBar, findNearestDonutSlice, findNearestPoint } from './headless/models';
import type { BarChartProps, CartesianChartProps, DonutChartProps } from './types';

export function useLineChart<T>(props: CartesianChartProps<T>) {
  const { data, xKey, yKey, width, height, progress, padding, color, strokeWidth, style, downsampleTo, onActivePointChange } = props;
  const deferredData = React.useDeferredValue(data);
  return React.useMemo(
    () =>
      computeLineGeometry({
        data: deferredData,
        xKey,
        yKey,
        width,
        height,
        progress,
        padding,
        color,
        strokeWidth,
        style,
        downsampleTo,
        onActivePointChange,
      }),
    [color, deferredData, downsampleTo, height, onActivePointChange, padding, progress, strokeWidth, style, width, xKey, yKey]
  );
}

export function useAreaChart<T>(props: CartesianChartProps<T>) {
  const { data, xKey, yKey, width, height, progress, padding, color, strokeWidth, style, downsampleTo, onActivePointChange } = props;
  const deferredData = React.useDeferredValue(data);
  return React.useMemo(
    () =>
      computeAreaGeometry({
        data: deferredData,
        xKey,
        yKey,
        width,
        height,
        progress,
        padding,
        color,
        strokeWidth,
        style,
        downsampleTo,
        onActivePointChange,
      }),
    [color, deferredData, downsampleTo, height, onActivePointChange, padding, progress, strokeWidth, style, width, xKey, yKey]
  );
}

export function useBarChart<T>(props: BarChartProps<T>) {
  const { data, categoryKey, valueKey, width, height, progress, selectedIndex, padding, color, style, onBarPress } = props;
  const deferredData = React.useDeferredValue(data);
  const bars = React.useMemo(
    () =>
      computeBarGeometry({
        data: deferredData,
        categoryKey,
        valueKey,
        width,
        height,
        progress,
        selectedIndex,
        padding,
        color,
        style,
        onBarPress,
      }),
    [categoryKey, color, deferredData, height, onBarPress, padding, progress, selectedIndex, style, valueKey, width]
  );

  return {
    bars,
    getBarAt(x: number, y: number) {
      return findNearestBar(bars, x, y);
    },
  };
}

export function useDonutChart(props: DonutChartProps) {
  const { data, width, height, progress, innerRadius, outerRadius, padAngle, selectedIndex, style, onSlicePress } = props;
  const deferredData = React.useDeferredValue(data);
  const slices = React.useMemo(
    () =>
      computeDonutGeometry({
        data: deferredData,
        width,
        height,
        progress,
        innerRadius,
        outerRadius,
        padAngle,
        selectedIndex,
        style,
        onSlicePress,
      }),
    [deferredData, height, innerRadius, onSlicePress, outerRadius, padAngle, progress, selectedIndex, style, width]
  );

  return {
    slices,
    getSliceAt(x: number, y: number) {
      return findNearestDonutSlice(slices, {
        x,
        y,
        width,
        height,
        innerRadius,
        outerRadius,
      });
    },
  };
}

export function useChartPressState<T>() {
  const [activeItem, setActiveItem] = React.useState<T | null>(null);
  const setItem = React.useEffectEvent((item: T | null) => {
    React.startTransition(() => {
      setActiveItem(item);
    });
  });

  return {
    activeItem,
    setActiveItem: setItem,
  };
}

export function useNearestPoint<T>(props: CartesianChartProps<T>, x: number, y?: number) {
  const geometry = useLineChart(props);
  return React.useMemo(
    () =>
      findNearestPoint(
        geometry.points.map((point) => ({ x: point.x, y: point.y })),
        x,
        y
      ),
    [geometry.points, x, y]
  );
}

export function useChartEntrance(keys: React.DependencyList, duration = 650) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let frame = 0;
    const startedAt = Date.now();
    setProgress(0);

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const eased = 1 - Math.pow(1 - Math.min(elapsed / duration, 1), 3);
      setProgress(eased);
      if (eased < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, keys);

  return progress;
}
