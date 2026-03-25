import type { ColorValue, ViewStyle } from 'react-native';

export type NumericAccessor<T> = keyof T | ((datum: T, index: number) => number);
export type CategoryAccessor<T> = keyof T | ((datum: T, index: number) => string);

export type DatumPoint = {
  x: number;
  y: number;
};

export type ChartPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type ChartTheme = {
  backgroundColor?: ColorValue;
  gridColor?: ColorValue;
  labelColor?: ColorValue;
  accentColor?: ColorValue;
};

export type GestureState = {
  x: number;
  y: number;
  active: boolean;
};

export type CartesianChartProps<T> = {
  data: T[];
  xKey: NumericAccessor<T>;
  yKey: NumericAccessor<T>;
  width: number;
  height: number;
  progress?: number;
  padding?: Partial<ChartPadding>;
  color?: ColorValue;
  strokeWidth?: number;
  style?: ViewStyle;
  downsampleTo?: number;
  onActivePointChange?: (datum: T | null, state: GestureState) => void;
};

export type BarChartProps<T> = {
  data: T[];
  categoryKey: CategoryAccessor<T>;
  valueKey: NumericAccessor<T>;
  width: number;
  height: number;
  progress?: number;
  selectedIndex?: number | null;
  padding?: Partial<ChartPadding>;
  color?: ColorValue;
  style?: ViewStyle;
  onBarPress?: (datum: T, index: number) => void;
};

export type DonutChartDatum = {
  label: string;
  value: number;
  color: ColorValue;
};

export type DonutChartProps = {
  data: DonutChartDatum[];
  width: number;
  height: number;
  progress?: number;
  innerRadius?: number;
  outerRadius?: number;
  padAngle?: number;
  selectedIndex?: number | null;
  style?: ViewStyle;
  onSlicePress?: (datum: DonutChartDatum, index: number) => void;
};

export type LinePathPoint<T> = {
  datum: T;
  x: number;
  y: number;
};

export type LineGeometry<T> = {
  path: string;
  points: LinePathPoint<T>[];
};

export type BarGeometry<T> = {
  datum: T;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

export type DonutSliceGeometry = {
  index: number;
  label: string;
  color: ColorValue;
  value: number;
  startAngle: number;
  endAngle: number;
  path: string;
};

export type DownsampleInput = {
  points: DatumPoint[];
  threshold: number;
};

export type HitTestInput = {
  points: DatumPoint[];
  targetX: number;
  targetY?: number;
};

export type NearestPointResult = {
  point: DatumPoint | null;
  index: number;
  distance: number;
};

export type ChartEngine = {
  name: 'native-nitro' | 'typescript-web' | 'typescript-fallback';
  downsampleSeries(input: DownsampleInput): DatumPoint[];
  findNearestDatum(input: HitTestInput): NearestPointResult;
};

export type CandlestickCandleGeometry<T> = {
  datum: T;
  index: number;
  centerX: number;
  openY: number;
  closeY: number;
  highY: number;
  lowY: number;
  bodyTop: number;
  bodyHeight: number;
  bodyWidth: number;
  volumeTop: number;
  isUp: boolean;
};

export type CandlestickOverlay<T> = {
  window: number;
  valueKey?: NumericAccessor<T>;
  color?: ColorValue;
  strokeWidth?: number;
  label?: string;
};

export type CandlestickGeometry<T> = {
  candles: CandlestickCandleGeometry<T>[];
  allCandles: CandlestickCandleGeometry<T>[];
  labels: CandlestickCandleGeometry<T>[];
  padding: ChartPadding;
  chartWidth: number;
  priceHeight: number;
  volumeHeight: number;
  gap: number;
  volumeBase: number;
  step: number;
  minPrice: number;
  maxPrice: number;
  maxVolume: number;
  overlayPaths: Array<{
    key: string;
    path: string;
    color: string;
    strokeWidth: number;
    label: string;
  }>;
};

export type CandlestickChartProps<T> = {
  data: T[];
  width: number;
  height: number;
  openKey: NumericAccessor<T>;
  highKey: NumericAccessor<T>;
  lowKey: NumericAccessor<T>;
  closeKey: NumericAccessor<T>;
  volumeKey: NumericAccessor<T>;
  labelKey?: CategoryAccessor<T>;
  progress?: number;
  padding?: Partial<ChartPadding>;
  volumeHeight?: number;
  gap?: number;
  upColor?: ColorValue;
  downColor?: ColorValue;
  style?: ViewStyle;
  overlays?: CandlestickOverlay<T>[];
  minVisibleCount?: number;
  onPinchZoom?: (nextVisibleCount: number, anchorRatio: number) => void;
  formatPriceLabel?: (value: number) => string;
  formatVolumeLabel?: (value: number) => string;
};

export type CandlestickNavigatorProps<T> = {
  data: T[];
  width: number;
  height?: number;
  start: number;
  end: number;
  closeKey: NumericAccessor<T>;
  labelKey?: CategoryAccessor<T>;
  style?: ViewStyle;
  onPanWindow: (nextCenter: number) => void;
  onResizeWindow: (edge: 'left' | 'right', nextIndex: number) => void;
};
