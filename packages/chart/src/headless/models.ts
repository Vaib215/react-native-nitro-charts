import { extent, max } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import { arc, area, line, pie } from 'd3-shape';

import { chartEngine } from '../engine';
import { resolvePadding } from '../utils/padding';
import { getCategoryValue, getNumericValue } from '../utils/accessors';
import type {
  BarChartProps,
  BarGeometry,
  CandlestickCandleGeometry,
  CandlestickChartProps,
  CandlestickGeometry,
  CandlestickNavigatorProps,
  CartesianChartProps,
  DatumPoint,
  DonutChartDatum,
  DonutChartProps,
  DonutSliceGeometry,
  LineGeometry,
  NumericAccessor,
} from '../types';

type CartesianFrame = {
  innerWidth: number;
  innerHeight: number;
  offsetX: number;
  offsetY: number;
};

function createCartesianFrame(width: number, height: number, padding?: CartesianChartProps<unknown>['padding']): CartesianFrame {
  const resolved = resolvePadding(padding);
  return {
    innerWidth: width - resolved.left - resolved.right,
    innerHeight: height - resolved.top - resolved.bottom,
    offsetX: resolved.left,
    offsetY: resolved.top,
  };
}

export function computeLineGeometry<T>(props: CartesianChartProps<T>): LineGeometry<T> {
  if (props.data.length === 0) {
    return {
      path: '',
      points: [],
    };
  }

  const frame = createCartesianFrame(props.width, props.height, props.padding);
  const rawPoints = props.data.map((datum, index) => ({
    datum,
    inputX: getNumericValue(datum, props.xKey, index),
    inputY: getNumericValue(datum, props.yKey, index),
  }));

  const xExtent = extent(rawPoints, (point) => point.inputX) as [number | undefined, number | undefined];
  const yMax = max(rawPoints, (point) => point.inputY) ?? 0;
  const domainMin = xExtent[0] ?? 0;
  const domainMax = xExtent[1] ?? domainMin + 1;
  const safeDomainMax = domainMin === domainMax ? domainMax + 1 : domainMax;

  const xScale = scaleLinear().domain([domainMin, safeDomainMax]).range([frame.offsetX, frame.offsetX + frame.innerWidth]);
  const yScale = scaleLinear().domain([0, yMax || 1]).nice().range([frame.offsetY + frame.innerHeight, frame.offsetY]);

  const scaledPoints = rawPoints.map((point) => ({
    datum: point.datum,
    x: xScale(point.inputX),
    y: yScale(point.inputY),
  }));

  const sampledPoints =
    props.downsampleTo && props.downsampleTo > 0
      ? chartEngine.downsampleSeries({
          points: scaledPoints.map((point) => ({ x: point.x, y: point.y })),
          threshold: props.downsampleTo,
        })
      : scaledPoints.map((point) => ({ x: point.x, y: point.y }));

  const pointMap = new Map(scaledPoints.map((point) => [`${point.x}:${point.y}`, point] as const));
  const points = sampledPoints
    .map((point) => pointMap.get(`${point.x}:${point.y}`))
    .filter((point): point is (typeof scaledPoints)[number] => Boolean(point));

  const pathBuilder = line<(typeof points)[number]>()
    .x((point) => point.x)
    .y((point) => point.y);

  return {
    path: pathBuilder(points) ?? '',
    points,
  };
}

export function computeAreaGeometry<T>(props: CartesianChartProps<T>): LineGeometry<T> {
  const frame = createCartesianFrame(props.width, props.height, props.padding);
  const lineGeometry = computeLineGeometry(props);

  const areaBuilder = area<(typeof lineGeometry.points)[number]>()
    .x((point) => point.x)
    .y0(frame.offsetY + frame.innerHeight)
    .y1((point) => point.y);

  return {
    path: areaBuilder(lineGeometry.points) ?? '',
    points: lineGeometry.points,
  };
}

export function computeBarGeometry<T>(props: BarChartProps<T>): BarGeometry<T>[] {
  if (props.data.length === 0) {
    return [];
  }

  const padding = resolvePadding(props.padding);
  const innerWidth = props.width - padding.left - padding.right;
  const innerHeight = props.height - padding.top - padding.bottom;
  const labels = props.data.map((datum, index) => getCategoryValue(datum, props.categoryKey, index));
  const values = props.data.map((datum, index) => getNumericValue(datum, props.valueKey, index));
  const yMax = max(values) ?? 0;

  const xScale = scaleBand<string>().domain(labels).range([padding.left, padding.left + innerWidth]).padding(0.2);
  const yScale = scaleLinear().domain([0, yMax || 1]).nice().range([padding.top + innerHeight, padding.top]);

  return props.data.map((datum, index) => {
    const label = labels[index];
    const value = values[index];
    const x = xScale(label) ?? padding.left;
    const y = yScale(value);
    return {
      datum,
      index,
      label,
      x,
      y,
      width: xScale.bandwidth(),
      height: padding.top + innerHeight - y,
    };
  });
}

export function computeDonutGeometry(props: DonutChartProps): DonutSliceGeometry[] {
  if (props.data.length === 0) {
    return [];
  }

  const radius = Math.min(props.width, props.height) / 2;
  const innerRadius = props.innerRadius ?? radius * 0.58;
  const outerRadius = props.outerRadius ?? radius * 0.92;
  const segments = pie<DonutChartDatum>()
    .sort(null)
    .value((datum) => datum.value)
    .padAngle(props.padAngle ?? 0.02)(props.data);
  const arcBuilder = arc<(typeof segments)[number]>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  return segments.map((segment) => ({
    index: segment.index,
    label: segment.data.label,
    color: segment.data.color,
    value: segment.data.value,
    startAngle: segment.startAngle,
    endAngle: segment.endAngle,
    path: arcBuilder(segment) ?? '',
  }));
}

export function findNearestPoint(points: DatumPoint[], targetX: number, targetY?: number) {
  return chartEngine.findNearestDatum({ points, targetX, targetY });
}

export function findNearestBar<T>(bars: BarGeometry<T>[], x: number, y: number) {
  return bars.find((bar) => x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) ?? null;
}

export function findNearestDonutSlice(
  slices: DonutSliceGeometry[],
  input: {
    x: number;
    y: number;
    width: number;
    height: number;
    innerRadius?: number;
    outerRadius?: number;
  }
) {
  if (slices.length === 0) {
    return null;
  }

  const centerX = input.width / 2;
  const centerY = input.height / 2;
  const dx = input.x - centerX;
  const dy = input.y - centerY;
  const radius = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = input.outerRadius ?? Math.min(input.width, input.height) * 0.92 * 0.5;
  const minRadius = input.innerRadius ?? Math.min(input.width, input.height) * 0.58 * 0.5;

  if (radius < minRadius || radius > maxRadius) {
    return null;
  }

  let angle = Math.atan2(dy, dx);
  angle += Math.PI / 2;
  if (angle < 0) {
    angle += Math.PI * 2;
  } else if (angle >= Math.PI * 2) {
    angle -= Math.PI * 2;
  }

  return slices.find((slice) => angle >= slice.startAngle && angle <= slice.endAngle) ?? null;
}

function buildPolylinePath(points: DatumPoint[]) {
  if (points.length === 0) {
    return '';
  }

  return points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path}${command}${point.x.toFixed(2)},${point.y.toFixed(2)} `;
  }, '');
}

function computeMovingAverage<T>(
  data: T[],
  window: number,
  accessor: NumericAccessor<T>
): Array<number | null> {
  const values: Array<number | null> = [];
  let sum = 0;

  for (let index = 0; index < data.length; index += 1) {
    sum += getNumericValue(data[index], accessor, index);
    if (index >= window) {
      sum -= getNumericValue(data[index - window], accessor, index - window);
    }
    values.push(index >= window - 1 ? sum / window : null);
  }

  return values;
}

export function computeCandlestickGeometry<T>(props: CandlestickChartProps<T>): CandlestickGeometry<T> {
  const { data, openKey, highKey, lowKey, closeKey, volumeKey, labelKey } = props;
  const paddingValues = resolvePadding(props.padding);
  const padding = {
    top: props.padding?.top ?? 18,
    right: props.padding?.right ?? 76,
    bottom: props.padding?.bottom ?? 28,
    left: props.padding?.left ?? 18,
  };
  const volumeHeight = props.volumeHeight ?? 82;
  const gap = props.gap ?? 18;
  const progress = Math.max(0, Math.min(props.progress ?? 1, 1));
  const height = props.height;
  const width = props.width;

  const priceHeight = Math.max(height - padding.top - padding.bottom - volumeHeight - gap, 180);
  const chartWidth = Math.max(width - padding.left - padding.right, 1);

  let minLow = Infinity;
  let maxHigh = -Infinity;
  let maxVolume = 0;

  for (let i = 0; i < data.length; i++) {
    const low = getNumericValue(data[i], lowKey, i);
    const high = getNumericValue(data[i], highKey, i);
    const vol = getNumericValue(data[i], volumeKey, i);
    if (low < minLow) minLow = low;
    if (high > maxHigh) maxHigh = high;
    if (vol > maxVolume) maxVolume = vol;
  }

  const span = Math.max(maxHigh - minLow, 1);
  const extendedMin = minLow - span * 0.08;
  const extendedMax = maxHigh + span * 0.08;
  const step = chartWidth / Math.max(data.length, 1);
  const bodyWidth = Math.max(Math.min(step * 0.62, 16), 4);
  const volumeBase = padding.top + priceHeight + gap + volumeHeight;

  const scaleY = (value: number) =>
    padding.top + ((extendedMax - value) / (extendedMax - extendedMin)) * priceHeight;
  const scaleVolumeY = (value: number) =>
    volumeBase - (value / Math.max(maxVolume, 1)) * volumeHeight;

  const allCandles: CandlestickCandleGeometry<T>[] = data.map((datum, index) => {
    const open = getNumericValue(datum, openKey, index);
    const close = getNumericValue(datum, closeKey, index);
    const high = getNumericValue(datum, highKey, index);
    const low = getNumericValue(datum, lowKey, index);
    const volume = getNumericValue(datum, volumeKey, index);
    const centerX = padding.left + step * index + step / 2;
    const openY = scaleY(open);
    const closeY = scaleY(close);
    const highY = scaleY(high);
    const lowY = scaleY(low);
    const bodyTop = Math.min(openY, closeY);
    const bodyBottom = Math.max(openY, closeY);
    return {
      datum,
      index,
      centerX,
      openY,
      closeY,
      highY,
      lowY,
      bodyTop,
      bodyHeight: Math.max(bodyBottom - bodyTop, 2),
      bodyWidth,
      volumeTop: scaleVolumeY(volume),
      isUp: close >= open,
    };
  });

  const visibleCount = Math.max(1, Math.round(allCandles.length * progress));
  const candles = allCandles.slice(0, visibleCount);
  const labels = allCandles.filter(
    (_, index) =>
      index === 0 ||
      index === allCandles.length - 1 ||
      index === Math.floor((allCandles.length - 1) / 2)
  );

  const overlayPaths = (props.overlays ?? []).map((overlay, overlayIndex) => {
    const accessor = overlay.valueKey ?? closeKey;
    const ma = computeMovingAverage(data, overlay.window, accessor);
    const points = allCandles
      .map((candle, index) => {
        const value = ma[index];
        return value === null ? null : { x: candle.centerX, y: scaleY(value) };
      })
      .filter((point): point is DatumPoint => point !== null);

    return {
      key: `overlay-${overlayIndex}`,
      path: buildPolylinePath(points),
      color: typeof overlay.color === 'string' ? overlay.color : '#60a5fa',
      strokeWidth: overlay.strokeWidth ?? 1.8,
      label: overlay.label ?? `SMA ${overlay.window}`,
    };
  });

  return {
    candles,
    allCandles,
    labels,
    padding,
    chartWidth,
    priceHeight,
    volumeHeight,
    gap,
    volumeBase,
    step,
    minPrice: extendedMin,
    maxPrice: extendedMax,
    maxVolume,
    overlayPaths,
  };
}

export function computeCandlestickNavigatorGeometry<T>(
  props: Pick<CandlestickNavigatorProps<T>, 'data' | 'width' | 'start' | 'end' | 'closeKey' | 'labelKey'>
) {
  const { data, width, start, end, closeKey } = props;
  const usableWidth = Math.max(width - 24, 1);
  let maxClose = -Infinity;
  let minClose = Infinity;

  for (let i = 0; i < data.length; i++) {
    const close = getNumericValue(data[i], closeKey, i);
    if (close > maxClose) maxClose = close;
    if (close < minClose) minClose = close;
  }

  const span = Math.max(maxClose - minClose, 1);
  const points: DatumPoint[] = data.map((datum, index) => {
    const close = getNumericValue(datum, closeKey, index);
    const x = 12 + (index / Math.max(data.length - 1, 1)) * usableWidth;
    const y = 44 - ((close - minClose) / span) * 28;
    return { x, y };
  });

  const sparklinePath = buildPolylinePath(points);
  const viewportLeft = 12 + (start / Math.max(data.length, 1)) * usableWidth;
  const viewportWidth = ((end - start) / Math.max(data.length, 1)) * usableWidth;

  return {
    sparklinePath,
    viewportLeft,
    viewportWidth: Math.max(viewportWidth, 24),
    usableWidth,
  };
}

export function findNearestCandlestick<T>(
  candles: CandlestickCandleGeometry<T>[],
  x: number
): CandlestickCandleGeometry<T> | null {
  if (candles.length === 0) {
    return null;
  }

  let nearest = candles[0];
  let minDist = Math.abs(x - candles[0].centerX);

  for (let i = 1; i < candles.length; i++) {
    const dist = Math.abs(x - candles[i].centerX);
    if (dist < minDist) {
      minDist = dist;
      nearest = candles[i];
    }
  }

  return nearest;
}
