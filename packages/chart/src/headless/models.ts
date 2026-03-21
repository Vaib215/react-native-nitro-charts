import { extent, max } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import { arc, area, line, pie } from 'd3-shape';

import { chartEngine } from '../engine';
import { resolvePadding } from '../utils/padding';
import { getCategoryValue, getNumericValue } from '../utils/accessors';
import type {
  BarChartProps,
  BarGeometry,
  CartesianChartProps,
  DatumPoint,
  DonutChartDatum,
  DonutChartProps,
  DonutSliceGeometry,
  LineGeometry,
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
