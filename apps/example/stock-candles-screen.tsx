import React from 'react';
import { PanResponder, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Circle, Line as SkiaLine, Path, Rect } from '@shopify/react-native-skia';

type Candle = {
  timestamp: number;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type ChartPoint = {
  x: number;
  y: number;
};

type DecoratedCandle = Candle & {
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

const LIFETIME_POINTS = 365;
const DEFAULT_VISIBLE_CANDLES = 7;
const MIN_VISIBLE_CANDLES = 3;

const watchlist = [
  { symbol: 'NVDA', price: '$987.42', move: '+4.2%' },
  { symbol: 'MSFT', price: '$428.07', move: '+1.3%' },
  { symbol: 'TSLA', price: '$211.54', move: '-2.7%' },
  { symbol: 'AMD', price: '$186.22', move: '+3.9%' },
];

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatCompactVolume(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  return `${(value / 1_000).toFixed(0)}K`;
}

function generateCandles(points: number) {
  const start = Date.UTC(2024, 0, 2);
  const candles: Candle[] = [];
  let previousClose = 182;

  for (let index = 0; index < points; index += 1) {
    const drift = Math.sin(index / 5) * 6.5 + Math.cos(index / 13) * 3.2 + index * 0.12;
    const open = previousClose + Math.sin(index * 1.6) * 1.9;
    const close = open + Math.sin(index / 2.3) * 5.8 + Math.cos(index / 8.5) * 2.9 + drift * 0.18;
    const high = Math.max(open, close) + 2.6 + ((index % 5) * 0.55);
    const low = Math.min(open, close) - 2.2 - ((index % 4) * 0.52);
    const volume = 1_600_000 + Math.round((Math.sin(index / 6) + 1.3) * 760_000 + index * 9_000);
    const date = new Date(start + index * 24 * 60 * 60 * 1000);

    candles.push({
      timestamp: date.getTime(),
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      open,
      high,
      low,
      close,
      volume,
    });

    previousClose = close;
  }

  return candles;
}

const lifetimeCandles = generateCandles(LIFETIME_POINTS);

function useChartEntrance(keys: React.DependencyList) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let frame = 0;
    const startedAt = Date.now();
    setProgress(0);

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const eased = 1 - Math.pow(1 - Math.min(elapsed / 650, 1), 3);
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

function buildLinePath(points: ChartPoint[]) {
  if (points.length === 0) {
    return '';
  }

  return points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path}${command}${point.x.toFixed(2)},${point.y.toFixed(2)} `;
  }, '');
}

function averageLine(data: Candle[], size: number, accessor: (item: Candle) => number) {
  const values: Array<number | null> = [];
  let sum = 0;

  for (let index = 0; index < data.length; index += 1) {
    sum += accessor(data[index]);
    if (index >= size) {
      sum -= accessor(data[index - size]);
    }
    values.push(index >= size - 1 ? sum / size : null);
  }

  return values;
}

function useCandlestickGeometry(data: Candle[], width: number, height: number, progress: number) {
  return React.useMemo(() => {
    const padding = { top: 18, right: 76, bottom: 28, left: 18 };
    const volumeHeight = 82;
    const gap = 18;
    const priceHeight = Math.max(height - padding.top - padding.bottom - volumeHeight - gap, 180);
    const chartWidth = Math.max(width - padding.left - padding.right, 1);
    const minLow = Math.min(...data.map((item) => item.low));
    const maxHigh = Math.max(...data.map((item) => item.high));
    const maxVolume = Math.max(...data.map((item) => item.volume));
    const span = Math.max(maxHigh - minLow, 1);
    const extendedMin = minLow - span * 0.08;
    const extendedMax = maxHigh + span * 0.08;
    const step = chartWidth / Math.max(data.length, 1);
    const bodyWidth = Math.max(Math.min(step * 0.62, 16), 4);
    const volumeBase = padding.top + priceHeight + gap + volumeHeight;
    const sma9 = averageLine(data, 9, (item) => item.close);
    const sma21 = averageLine(data, 21, (item) => item.close);

    const scaleY = (value: number) => padding.top + ((extendedMax - value) / (extendedMax - extendedMin)) * priceHeight;
    const scaleVolumeY = (value: number) => volumeBase - (value / Math.max(maxVolume, 1)) * volumeHeight;

    const allCandles: DecoratedCandle[] = data.map((datum, index) => {
      const centerX = padding.left + step * index + step / 2;
      const openY = scaleY(datum.open);
      const closeY = scaleY(datum.close);
      const highY = scaleY(datum.high);
      const lowY = scaleY(datum.low);
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      return {
        ...datum,
        index,
        centerX,
        openY,
        closeY,
        highY,
        lowY,
        bodyTop,
        bodyHeight: Math.max(bodyBottom - bodyTop, 2),
        bodyWidth,
        volumeTop: scaleVolumeY(datum.volume),
        isUp: datum.close >= datum.open,
      };
    });

    const visibleCount = Math.max(1, Math.round(allCandles.length * progress));
    const visibleCandles = allCandles.slice(0, visibleCount);
    const labels = allCandles.filter((_, index) => index === 0 || index === allCandles.length - 1 || index === Math.floor((allCandles.length - 1) / 2));

    const averagePath9 = buildLinePath(
      allCandles
        .map((candle, index) => {
          const value = sma9[index];
          return value === null ? null : { x: candle.centerX, y: scaleY(value) };
        })
        .filter((point): point is ChartPoint => point !== null)
    );

    const averagePath21 = buildLinePath(
      allCandles
        .map((candle, index) => {
          const value = sma21[index];
          return value === null ? null : { x: candle.centerX, y: scaleY(value) };
        })
        .filter((point): point is ChartPoint => point !== null)
    );

    return {
      allCandles,
      candles: visibleCandles,
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
      averagePath9,
      averagePath21,
    };
  }, [data, height, progress, width]);
}

function useViewport(dataLength: number, defaultVisible: number) {
  const [visibleCount, setVisibleCount] = React.useState(defaultVisible);
  const [windowEnd, setWindowEnd] = React.useState(dataLength);

  React.useEffect(() => {
    setVisibleCount(Math.min(defaultVisible, dataLength));
    setWindowEnd(dataLength);
  }, [dataLength, defaultVisible]);

  const boundedVisible = Math.max(MIN_VISIBLE_CANDLES, Math.min(visibleCount, dataLength));
  const boundedEnd = Math.max(boundedVisible, Math.min(windowEnd, dataLength));
  const start = Math.max(0, boundedEnd - boundedVisible);

  return {
    visibleCount: boundedVisible,
    setVisibleCount,
    windowEnd: boundedEnd,
    setWindowEnd,
    start,
    end: boundedEnd,
  };
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricNumber, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

const Navigator = React.memo(function Navigator({
  data,
  width,
  start,
  end,
  onPanWindow,
  onResizeWindow,
}: {
  data: Candle[];
  width: number;
  start: number;
  end: number;
  onPanWindow: (nextCenter: number) => void;
  onResizeWindow: (edge: 'left' | 'right', nextIndex: number) => void;
}) {
  const usableWidth = Math.max(width - 24, 1);
  const maxClose = Math.max(...data.map((item) => item.close));
  const minClose = Math.min(...data.map((item) => item.close));
  const span = Math.max(maxClose - minClose, 1);
  const points = data.map((item, index) => {
    const x = 12 + (index / Math.max(data.length - 1, 1)) * usableWidth;
    const y = 44 - ((item.close - minClose) / span) * 28;
    return { x, y };
  });
  const timeMarkers = data.filter((_, index) => {
    if (index === 0 || index === data.length - 1) {
      return true;
    }
    return index === Math.floor((data.length - 1) / 3) || index === Math.floor(((data.length - 1) * 2) / 3);
  });
  const viewportLeft = 12 + (start / Math.max(data.length, 1)) * usableWidth;
  const viewportWidth = ((end - start) / Math.max(data.length, 1)) * usableWidth;
  const dragMode = React.useRef<'window' | 'left' | 'right' | null>(null);
  const pickDragMode = React.useCallback(
    (locationX: number) => {
      const leftHandleX = viewportLeft;
      const rightHandleX = viewportLeft + Math.max(viewportWidth, 24);
      if (Math.abs(locationX - leftHandleX) <= 18) {
        return 'left' as const;
      }
      if (Math.abs(locationX - rightHandleX) <= 18) {
        return 'right' as const;
      }
      return 'window' as const;
    },
    [viewportLeft, viewportWidth]
  );
  const indexFromLocation = React.useCallback(
    (locationX: number) => {
      const ratio = Math.max(0, Math.min(1, (locationX - 12) / usableWidth));
      return Math.round(ratio * data.length);
    },
    [data.length, usableWidth]
  );
  const updateDrag = React.useCallback(
    (locationX: number) => {
      const nextIndex = indexFromLocation(locationX);
      if (dragMode.current === 'window') {
        onPanWindow(nextIndex);
        return;
      }
      if (dragMode.current === 'left' || dragMode.current === 'right') {
        onResizeWindow(dragMode.current, nextIndex);
      }
    },
    [indexFromLocation, onPanWindow, onResizeWindow]
  );
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          dragMode.current = pickDragMode(event.nativeEvent.locationX);
          updateDrag(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          if (!dragMode.current) {
            return;
          }
          updateDrag(event.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          dragMode.current = null;
        },
        onPanResponderTerminate: () => {
          dragMode.current = null;
        },
      }),
    [pickDragMode, updateDrag]
  );

  return (
    <View style={[styles.navigator, { width }]}>
      <View style={styles.navigatorGlow} />
      <Canvas style={{ width, height: 56 }}>
        <Path path={buildLinePath(points)} color="#7dd3fc" style="stroke" strokeWidth={1.6} />
      </Canvas>
      <View style={[styles.navigatorViewport, { left: viewportLeft, width: Math.max(viewportWidth, 24) }]} />
      <View style={[styles.navigatorHandle, styles.navigatorHandleLeft, { left: viewportLeft - 7 }]} />
      <View style={[styles.navigatorHandle, styles.navigatorHandleRight, { left: viewportLeft + Math.max(viewportWidth, 24) - 7 }]} />
      <View pointerEvents="none" style={styles.navigatorScale}>
        {timeMarkers.map((item, index) => {
          const ratio = index === 0 ? 0 : index === timeMarkers.length - 1 ? 1 : index === 1 ? 1 / 3 : 2 / 3;
          const left = 12 + ratio * usableWidth;
          return (
            <View key={`${item.timestamp}-marker`} style={[styles.navigatorMarker, { left: left - 20 }]}>
              <View style={styles.navigatorMarkerTick} />
              <Text style={styles.navigatorMarkerText}>{item.label}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.navigatorHint}>
        <Text style={styles.navigatorHintText}>Drag center to pan, drag corners to resize</Text>
      </View>
      <View
        style={StyleSheet.absoluteFill}
        onPointerDown={(event) => {
          const locationX = event.nativeEvent.offsetX ?? 0;
          dragMode.current = pickDragMode(locationX);
          updateDrag(locationX);
        }}
        onPointerMove={(event) => {
          if (!dragMode.current) {
            return;
          }
          updateDrag(event.nativeEvent.offsetX ?? 0);
        }}
        onPointerUp={() => {
          dragMode.current = null;
        }}
        onPointerLeave={() => {
          dragMode.current = null;
        }}
        {...panResponder.panHandlers}
      />
    </View>
  );
});

const TradingChart = React.memo(function TradingChart({
  data,
  width,
  height,
  visibleCount,
  onPinchZoom,
}: {
  data: Candle[];
  width: number;
  height: number;
  visibleCount: number;
  onPinchZoom: (nextVisibleCount: number, anchorRatio: number) => void;
}) {
  const progress = useChartEntrance([]);
  const geometry = useCandlestickGeometry(data, width, height, progress);
  const [activeIndex, setActiveIndex] = React.useState(Math.max(geometry.allCandles.length - 1, 0));
  const pinchStartDistance = React.useRef(0);
  const pinchStartVisibleCount = React.useRef(visibleCount);
  const priceTicks = [0, 0.25, 0.5, 0.75, 1];
  const volumeTicks = [0, 0.5, 1];

  React.useEffect(() => {
    setActiveIndex(Math.max(geometry.allCandles.length - 1, 0));
  }, [geometry.allCandles.length]);

  React.useEffect(() => {
    pinchStartVisibleCount.current = visibleCount;
  }, [visibleCount]);

  const activeCandle = geometry.allCandles[activeIndex] ?? geometry.allCandles[geometry.allCandles.length - 1];

  const handleHover = React.useCallback(
    (locationX: number) => {
      const relative = locationX - geometry.padding.left;
      const nextIndex = Math.max(0, Math.min(geometry.allCandles.length - 1, Math.round(relative / geometry.step - 0.5)));
      setActiveIndex(nextIndex);
    },
    [geometry.allCandles.length, geometry.padding.left, geometry.step]
  );

  const handleWheelZoom = React.useCallback(
    (event: { nativeEvent: { offsetX?: number; deltaY?: number; ctrlKey?: boolean }; preventDefault?: () => void }) => {
      if (!event.nativeEvent.ctrlKey) {
        return;
      }

      event.preventDefault?.();
      const deltaY = event.nativeEvent.deltaY ?? 0;
      const zoomFactor = deltaY > 0 ? 1.12 : 0.88;
      const nextVisibleCount = Math.max(MIN_VISIBLE_CANDLES, Math.round(visibleCount * zoomFactor));
      const anchorRatio = Math.max(
        0,
        Math.min(1, ((event.nativeEvent.offsetX ?? geometry.padding.left) - geometry.padding.left) / Math.max(geometry.chartWidth, 1))
      );
      onPinchZoom(nextVisibleCount, anchorRatio);
    },
    [geometry.chartWidth, geometry.padding.left, onPinchZoom, visibleCount]
  );

  const beginPinch = React.useCallback((touches: readonly { pageX: number; pageY: number }[]) => {
    if (touches.length < 2) {
      return;
    }
    const [a, b] = touches;
    pinchStartDistance.current = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
    pinchStartVisibleCount.current = visibleCount;
  }, [visibleCount]);

  const updatePinch = React.useCallback(
    (touches: readonly { pageX: number; pageY: number; locationX?: number }[]) => {
      if (touches.length < 2 || pinchStartDistance.current <= 0) {
        return;
      }
      const [a, b] = touches;
      const distance = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
      const midpointX = ((a.locationX ?? 0) + (b.locationX ?? 0)) / 2;
      const scale = distance / pinchStartDistance.current;
      const nextVisibleCount = Math.max(MIN_VISIBLE_CANDLES, Math.round(pinchStartVisibleCount.current / Math.max(scale, 0.4)));
      const anchorRatio = Math.max(0, Math.min(1, (midpointX - geometry.padding.left) / Math.max(geometry.chartWidth, 1)));
      onPinchZoom(nextVisibleCount, anchorRatio);
    },
    [geometry.chartWidth, geometry.padding.left, onPinchZoom]
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const touches = event.nativeEvent.touches;
          if (touches.length >= 2) {
            beginPinch(touches);
            return;
          }
          handleHover(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          const touches = event.nativeEvent.touches;
          if (touches.length >= 2) {
            updatePinch(touches);
            return;
          }
          handleHover(event.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          pinchStartDistance.current = 0;
        },
        onPanResponderTerminate: () => {
          pinchStartDistance.current = 0;
        },
      }),
    [beginPinch, handleHover, updatePinch]
  );

  return (
    <View style={[styles.chartShell, { width, height }]}>
      <View pointerEvents="none" style={styles.axisLayer}>
        {priceTicks.map((tick) => {
          const price = geometry.maxPrice - (geometry.maxPrice - geometry.minPrice) * tick;
          const top = geometry.padding.top + geometry.priceHeight * tick;
          return (
            <View key={`price-${tick}`} style={[styles.gridRow, { top }]}>
              <View style={styles.gridLine} />
              <Text style={styles.gridLabel}>{formatMoney(price)}</Text>
            </View>
          );
        })}

        {volumeTicks.map((tick) => {
          const top = geometry.volumeBase - geometry.volumeHeight * tick;
          const volume = geometry.maxVolume * tick;
          return (
            <View key={`volume-${tick}`} style={[styles.gridRow, { top }]}>
              <View style={styles.gridLineMuted} />
              <Text style={styles.gridLabelMuted}>{formatCompactVolume(volume)}</Text>
            </View>
          );
        })}
      </View>

      <Canvas style={{ width, height }}>
        <Path path={geometry.averagePath21} color="#60a5fa" style="stroke" strokeWidth={1.8} />
        <Path path={geometry.averagePath9} color="#f59e0b" style="stroke" strokeWidth={1.8} />

        {geometry.candles.map((candle) => {
          const color = candle.isUp ? '#22c55e' : '#f43f5e';
          return (
            <React.Fragment key={candle.timestamp}>
              <Rect
                x={candle.centerX - candle.bodyWidth / 2}
                y={candle.volumeTop}
                width={Math.max(candle.bodyWidth * 0.88, 2)}
                height={Math.max(geometry.volumeBase - candle.volumeTop, 2)}
                color={candle.isUp ? 'rgba(34,197,94,0.32)' : 'rgba(244,63,94,0.28)'}
              />
              <SkiaLine p1={{ x: candle.centerX, y: candle.highY }} p2={{ x: candle.centerX, y: candle.lowY }} color={color} strokeWidth={1.4} />
              <Rect x={candle.centerX - candle.bodyWidth / 2} y={candle.bodyTop} width={candle.bodyWidth} height={candle.bodyHeight} color={color} />
            </React.Fragment>
          );
        })}

        {activeCandle ? (
          <>
            <SkiaLine
              p1={{ x: activeCandle.centerX, y: geometry.padding.top }}
              p2={{ x: activeCandle.centerX, y: geometry.volumeBase }}
              color="rgba(226,232,240,0.24)"
              strokeWidth={1}
            />
            <SkiaLine
              p1={{ x: geometry.padding.left, y: activeCandle.closeY }}
              p2={{ x: width - geometry.padding.right, y: activeCandle.closeY }}
              color="rgba(226,232,240,0.16)"
              strokeWidth={1}
            />
            <Circle cx={activeCandle.centerX} cy={activeCandle.closeY} r={4.6} color="#f8fafc" />
            <Circle cx={activeCandle.centerX} cy={activeCandle.closeY} r={2.2} color={activeCandle.isUp ? '#22c55e' : '#f43f5e'} />
          </>
        ) : null}
      </Canvas>

      {activeCandle ? (
        <>
          <View pointerEvents="none" style={[styles.floatingPriceTag, { top: activeCandle.closeY - 12 }]}>
            <Text style={styles.floatingPriceText}>{formatMoney(activeCandle.close)}</Text>
          </View>
          <View pointerEvents="none" style={[styles.floatingDateTag, { left: activeCandle.centerX - 34 }]}>
            <Text style={styles.floatingDateText}>{activeCandle.label}</Text>
          </View>
        </>
      ) : null}

      {activeCandle ? (
        <View pointerEvents="none" style={styles.legendHudRow}>
          <View style={styles.legendHud}>
            <Text style={styles.legendHudText}>
              {activeCandle.label}  O {formatMoney(activeCandle.open)}  H {formatMoney(activeCandle.high)}  L {formatMoney(activeCandle.low)}  C {formatMoney(activeCandle.close)}  V {formatCompactVolume(activeCandle.volume)}
            </Text>
          </View>
        </View>
      ) : null}

      <View pointerEvents="none" style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>SMA 9</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: '#60a5fa' }]} />
          <Text style={styles.legendText}>SMA 21</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Volume</Text>
        </View>
      </View>

      <View pointerEvents="none" style={styles.bottomLabelRow}>
        {geometry.labels.map((label) => (
          <Text key={`${label.timestamp}-axis`} style={[styles.bottomLabel, { left: label.centerX - 20 }]}>
            {label.label}
          </Text>
        ))}
      </View>

      <View
        style={StyleSheet.absoluteFill}
        onPointerDown={(event) => handleHover(event.nativeEvent.offsetX ?? 0)}
        onPointerMove={(event) => handleHover(event.nativeEvent.offsetX ?? 0)}
        {...(Platform.OS === 'web' ? ({ onWheel: handleWheelZoom } as Record<string, unknown>) : {})}
        {...panResponder.panHandlers}
      />
    </View>
  );
});

export default function StockCandlesScreen() {
  const { width } = useWindowDimensions();
  const [availableWidth, setAvailableWidth] = React.useState<number | null>(null);
  const allData = lifetimeCandles;
  const viewport = useViewport(allData.length, DEFAULT_VISIBLE_CANDLES);
  const visibleData = allData.slice(viewport.start, viewport.end);
  const containerWidth = availableWidth ?? width;
  const chartWidth = Math.min(Math.max(containerWidth - 32, 280), 1040);
  const chartHeight = 470;
  const firstCandle = visibleData[0];
  const lastCandle = visibleData[visibleData.length - 1];
  const move = lastCandle.close - firstCandle.open;
  const movePct = (move / firstCandle.open) * 100;
  const rangeLow = Math.min(...visibleData.map((item) => item.low));
  const rangeHigh = Math.max(...visibleData.map((item) => item.high));
  const volume = visibleData.reduce((sum, item) => sum + item.volume, 0);

  const jumpNavigator = React.useCallback(
    (nextCenter: number) => {
      const half = Math.round(viewport.visibleCount / 2);
      const boundedEnd = Math.max(viewport.visibleCount, Math.min(allData.length, nextCenter + half));
      viewport.setWindowEnd(boundedEnd);
    },
    [allData.length, viewport]
  );

  const pinchZoom = React.useCallback(
    (nextVisibleCount: number, anchorRatio: number) => {
      const clampedVisible = Math.max(MIN_VISIBLE_CANDLES, Math.min(allData.length, nextVisibleCount));
      const anchorIndex = viewport.start + anchorRatio * Math.max(viewport.visibleCount - 1, 1);
      const unclampedStart = Math.round(anchorIndex - anchorRatio * clampedVisible);
      const clampedStart = Math.max(0, Math.min(allData.length - clampedVisible, unclampedStart));
      viewport.setVisibleCount(clampedVisible);
      viewport.setWindowEnd(clampedStart + clampedVisible);
    },
    [allData.length, viewport]
  );

  const resizeWindow = React.useCallback(
    (edge: 'left' | 'right', nextIndex: number) => {
      if (edge === 'left') {
        const nextStart = Math.max(0, Math.min(nextIndex, viewport.end - MIN_VISIBLE_CANDLES));
        const nextVisible = Math.max(MIN_VISIBLE_CANDLES, viewport.end - nextStart);
        viewport.setVisibleCount(nextVisible);
        viewport.setWindowEnd(nextStart + nextVisible);
        return;
      }

      const nextEnd = Math.max(viewport.start + MIN_VISIBLE_CANDLES, Math.min(allData.length, nextIndex));
      const nextVisible = Math.max(MIN_VISIBLE_CANDLES, nextEnd - viewport.start);
      viewport.setVisibleCount(nextVisible);
      viewport.setWindowEnd(viewport.start + nextVisible);
    },
    [allData.length, viewport]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <View
        style={styles.pageBody}
        onLayout={(event) => {
          setAvailableWidth(event.nativeEvent.layout.width);
        }}
      >
        <View style={[styles.hero, { width: chartWidth }]}>
          <View style={styles.heroBlurA} />
          <View style={styles.heroBlurB} />
          <Text style={styles.heroEyebrow}>TradingView-Inspired Example</Text>
          <Text style={styles.heroTitle}>Interactive candlestick chart with lifetime scrubber</Text>
          <Text style={styles.heroSubtitle}>
            The chart now opens on a 7-day window inside a lifetime timeline. Drag the center of the bottom range to pan, or drag either corner handle to resize the viewable time span.
          </Text>
          <View style={styles.heroStats}>
            <MetricCard label="symbol" value="NVDA" />
            <MetricCard label="visible candles" value={String(viewport.visibleCount)} />
            <MetricCard label="period move" value={`${move >= 0 ? '+' : ''}${movePct.toFixed(2)}%`} accent={move >= 0 ? '#22c55e' : '#f43f5e'} />
          </View>
        </View>

        <View style={[styles.panel, { width: chartWidth }]}>
          <View style={styles.panelHeader}>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Viewport close</Text>
              <Text style={styles.priceValue}>{formatMoney(lastCandle.close)}</Text>
              <Text style={[styles.priceDelta, { color: lastCandle.close >= lastCandle.open ? '#22c55e' : '#f43f5e' }]}>
                Drag to inspect, pinch to zoom, drag timeline handles to resize
              </Text>
            </View>
          </View>

          <View style={styles.metricGrid}>
            <MetricCard label="last open" value={formatMoney(lastCandle.open)} />
            <MetricCard label="last high" value={formatMoney(lastCandle.high)} />
            <MetricCard label="last low" value={formatMoney(lastCandle.low)} />
            <MetricCard label="last volume" value={formatCompactVolume(lastCandle.volume)} />
            <MetricCard label="window low" value={formatMoney(rangeLow)} />
            <MetricCard label="window high" value={formatMoney(rangeHigh)} />
          </View>

          <TradingChart
            data={visibleData}
            width={chartWidth - 36}
            height={chartHeight}
            visibleCount={viewport.visibleCount}
            onPinchZoom={pinchZoom}
          />

          <Navigator
            data={allData}
            width={chartWidth - 36}
            start={viewport.start}
            end={viewport.end}
            onPanWindow={jumpNavigator}
            onResizeWindow={resizeWindow}
          />

          <View style={styles.footerRow}>
            <View style={styles.sessionCard}>
              <Text style={styles.sessionLabel}>Latest session</Text>
              <Text style={styles.sessionValue}>{lastCandle.label}</Text>
              <Text style={styles.sessionCopy}>
                O {formatMoney(lastCandle.open)}  H {formatMoney(lastCandle.high)}  L {formatMoney(lastCandle.low)}  C {formatMoney(lastCandle.close)}
              </Text>
            </View>

            <View style={styles.sessionCard}>
              <Text style={styles.sessionLabel}>Viewport summary</Text>
              <Text style={styles.sessionValue}>
                {formatMoney(rangeLow)} to {formatMoney(rangeHigh)}
              </Text>
              <Text style={styles.sessionCopy}>
                Aggregate volume {formatCompactVolume(volume)} across candles {viewport.start + 1} to {viewport.end}.
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.watchlistPanel, { width: chartWidth }]}>
          <Text style={styles.watchlistTitle}>Momentum board</Text>
          <View style={styles.watchlistRow}>
            {watchlist.map((item) => (
              <View key={item.symbol} style={styles.watchlistCard}>
                <Text style={styles.watchlistSymbol}>{item.symbol}</Text>
                <Text style={styles.watchlistPrice}>{item.price}</Text>
                <Text style={[styles.watchlistMove, { color: item.move.startsWith('+') ? '#22c55e' : '#f43f5e' }]}>{item.move}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7f8',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 20,
  },
  pageBody: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 34,
    padding: 28,
    gap: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e3e8eb',
  },
  heroBlurA: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 118, 110, 0.06)',
    right: -70,
    top: -80,
  },
  heroBlurB: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    left: -80,
    bottom: -110,
  },
  heroEyebrow: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#0f1720',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  heroSubtitle: {
    maxWidth: 760,
    color: '#5f6c76',
    fontSize: 15,
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  panel: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e3e8eb',
    gap: 18,
  },
  panelHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  priceBlock: {
    gap: 4,
  },
  priceLabel: {
    color: '#5f6c76',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  priceValue: {
    color: '#0f1720',
    fontSize: 32,
    fontWeight: '700',
  },
  priceDelta: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    minWidth: 150,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f7f9fa',
    borderWidth: 1,
    borderColor: '#e5eaed',
    gap: 6,
  },
  metricLabel: {
    color: '#5f6c76',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricNumber: {
    color: '#0f1720',
    fontSize: 16,
    fontWeight: '700',
  },
  chartShell: {
    position: 'relative',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fcfdfd',
    borderWidth: 1,
    borderColor: '#e5eaed',
  },
  axisLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#e8edef',
  },
  gridLineMuted: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#f0f3f5',
  },
  gridLabel: {
    width: 72,
    color: '#6b7a86',
    fontSize: 11,
    textAlign: 'right',
    paddingRight: 12,
  },
  gridLabelMuted: {
    width: 72,
    color: '#8b98a3',
    fontSize: 10,
    textAlign: 'right',
    paddingRight: 12,
  },
  floatingPriceTag: {
    position: 'absolute',
    right: 8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#dbeafe',
  },
  floatingPriceText: {
    color: '#0b2242',
    fontSize: 11,
    fontWeight: '700',
  },
  floatingDateTag: {
    position: 'absolute',
    bottom: 72,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0f1720',
  },
  floatingDateText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  legendRow: {
    position: 'absolute',
    bottom: 34,
    left: 12,
    right: 84,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendHudRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 84,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendHud: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#dce4e8',
  },
  legendHudText: {
    color: '#1f2a33',
    fontSize: 11,
    fontWeight: '700',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#e1e7ea',
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendText: {
    color: '#33424d',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomLabelRow: {
    position: 'absolute',
    left: 0,
    right: 76,
    bottom: 8,
    height: 18,
  },
  bottomLabel: {
    position: 'absolute',
    width: 56,
    color: '#6b7a86',
    fontSize: 11,
    textAlign: 'center',
  },
  navigator: {
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#f7f9fa',
    borderWidth: 1,
    borderColor: '#e5eaed',
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  navigatorGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 118, 110, 0.03)',
  },
  navigatorViewport: {
    position: 'absolute',
    top: 8,
    bottom: 34,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.28)',
  },
  navigatorHandle: {
    position: 'absolute',
    top: 18,
    width: 14,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#d9eeeb',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.16)',
  },
  navigatorHandleLeft: {
    marginLeft: 0,
  },
  navigatorHandleRight: {
    marginLeft: 0,
  },
  navigatorScale: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 22,
    height: 28,
  },
  navigatorMarker: {
    position: 'absolute',
    width: 40,
    alignItems: 'center',
    gap: 4,
  },
  navigatorMarkerTick: {
    width: 1,
    height: 8,
    backgroundColor: '#c8d2d8',
  },
  navigatorMarkerText: {
    color: '#6b7a86',
    fontSize: 10,
    fontWeight: '600',
  },
  navigatorHint: {
    alignItems: 'center',
    paddingTop: 2,
  },
  navigatorHintText: {
    color: '#6b7a86',
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sessionCard: {
    flex: 1,
    minWidth: 280,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f9fa',
    borderWidth: 1,
    borderColor: '#e5eaed',
    gap: 6,
  },
  sessionLabel: {
    color: '#5f6c76',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sessionValue: {
    color: '#0f1720',
    fontSize: 18,
    fontWeight: '700',
  },
  sessionCopy: {
    color: '#5f6c76',
    fontSize: 13,
    lineHeight: 19,
  },
  watchlistPanel: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e3e8eb',
    gap: 14,
  },
  watchlistTitle: {
    color: '#0f1720',
    fontSize: 18,
    fontWeight: '700',
  },
  watchlistRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  watchlistCard: {
    minWidth: 150,
    flexGrow: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f9fa',
    borderWidth: 1,
    borderColor: '#e5eaed',
    gap: 6,
  },
  watchlistSymbol: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  watchlistPrice: {
    color: '#0f1720',
    fontSize: 18,
    fontWeight: '700',
  },
  watchlistMove: {
    fontSize: 13,
    fontWeight: '700',
  },
});
