import React from 'react';
import { PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Line as SkiaLine, Path, Rect } from '@shopify/react-native-skia';

import { computeCandlestickGeometry, findNearestCandlestick } from '../headless/models';
import { getNumericValue, getCategoryValue } from '../utils/accessors';
import { toSkiaColor } from './shared';
import type { CandlestickChartProps } from '../types';

const DEFAULT_MIN_VISIBLE = 3;

function CandlestickChartComponent<T>(props: CandlestickChartProps<T>) {
  const {
    data,
    width,
    height,
    openKey,
    highKey,
    lowKey,
    closeKey,
    volumeKey,
    labelKey,
    progress: progressProp,
    padding,
    volumeHeight,
    gap,
    upColor: upColorProp,
    downColor: downColorProp,
    style,
    overlays,
    minVisibleCount = DEFAULT_MIN_VISIBLE,
    onPinchZoom,
    formatPriceLabel,
    formatVolumeLabel,
  } = props;

  const progress = Math.max(0, Math.min(progressProp ?? 1, 1));
  const upColor = toSkiaColor(upColorProp, '#22c55e');
  const downColor = toSkiaColor(downColorProp, '#f43f5e');
  const fmtPrice = formatPriceLabel ?? ((v: number) => `$${v.toFixed(2)}`);
  const fmtVolume = formatVolumeLabel ?? ((v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M` : `${(v / 1_000).toFixed(0)}K`
  );

  const geometry = React.useMemo(
    () =>
      computeCandlestickGeometry({
        data,
        width,
        height,
        openKey,
        highKey,
        lowKey,
        closeKey,
        volumeKey,
        labelKey,
        progress,
        padding,
        volumeHeight,
        gap,
        overlays,
      }),
    [data, width, height, openKey, highKey, lowKey, closeKey, volumeKey, labelKey, progress, padding, volumeHeight, gap, overlays]
  );

  const [activeIndex, setActiveIndex] = React.useState(Math.max(geometry.allCandles.length - 1, 0));
  const pinchStartDistance = React.useRef(0);
  const pinchStartVisibleCount = React.useRef(data.length);

  React.useEffect(() => {
    setActiveIndex(Math.max(geometry.allCandles.length - 1, 0));
  }, [geometry.allCandles.length]);

  const activeCandle = geometry.allCandles[activeIndex] ?? geometry.allCandles[geometry.allCandles.length - 1];

  const handleHover = React.useCallback(
    (locationX: number) => {
      const relative = locationX - geometry.padding.left;
      const nextIndex = Math.max(
        0,
        Math.min(geometry.allCandles.length - 1, Math.round(relative / geometry.step - 0.5))
      );
      setActiveIndex(nextIndex);
    },
    [geometry.allCandles.length, geometry.padding.left, geometry.step]
  );

  const handleWheelZoom = React.useCallback(
    (event: { nativeEvent: { offsetX?: number; deltaY?: number; ctrlKey?: boolean }; preventDefault?: () => void }) => {
      if (!event.nativeEvent.ctrlKey || !onPinchZoom) return;
      event.preventDefault?.();
      const deltaY = event.nativeEvent.deltaY ?? 0;
      const zoomFactor = deltaY > 0 ? 1.12 : 0.88;
      const nextVisibleCount = Math.max(minVisibleCount, Math.round(data.length * zoomFactor));
      const anchorRatio = Math.max(
        0,
        Math.min(1, ((event.nativeEvent.offsetX ?? geometry.padding.left) - geometry.padding.left) / Math.max(geometry.chartWidth, 1))
      );
      onPinchZoom(nextVisibleCount, anchorRatio);
    },
    [data.length, geometry.chartWidth, geometry.padding.left, minVisibleCount, onPinchZoom]
  );

  const beginPinch = React.useCallback(
    (touches: readonly { pageX: number; pageY: number }[]) => {
      if (touches.length < 2) return;
      const [a, b] = touches;
      pinchStartDistance.current = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
      pinchStartVisibleCount.current = data.length;
    },
    [data.length]
  );

  const updatePinch = React.useCallback(
    (touches: readonly { pageX: number; pageY: number; locationX?: number }[]) => {
      if (touches.length < 2 || pinchStartDistance.current <= 0 || !onPinchZoom) return;
      const [a, b] = touches;
      const distance = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
      const midpointX = ((a.locationX ?? 0) + (b.locationX ?? 0)) / 2;
      const scale = distance / pinchStartDistance.current;
      const nextVisibleCount = Math.max(minVisibleCount, Math.round(pinchStartVisibleCount.current / Math.max(scale, 0.4)));
      const anchorRatio = Math.max(0, Math.min(1, (midpointX - geometry.padding.left) / Math.max(geometry.chartWidth, 1)));
      onPinchZoom(nextVisibleCount, anchorRatio);
    },
    [geometry.chartWidth, geometry.padding.left, minVisibleCount, onPinchZoom]
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

  const priceTicks = [0, 0.25, 0.5, 0.75, 1];
  const volumeTicks = [0, 0.5, 1];

  return (
    <View style={[styles.chartShell, { width, height }, style]}>
      <View pointerEvents="none" style={styles.axisLayer}>
        {priceTicks.map((tick) => {
          const price = geometry.maxPrice - (geometry.maxPrice - geometry.minPrice) * tick;
          const top = geometry.padding.top + geometry.priceHeight * tick;
          return (
            <View key={`price-${tick}`} style={[styles.gridRow, { top }]}>
              <View style={styles.gridLine} />
              <Text style={styles.gridLabel}>{fmtPrice(price)}</Text>
            </View>
          );
        })}

        {volumeTicks.map((tick) => {
          const top = geometry.volumeBase - geometry.volumeHeight * tick;
          const volume = geometry.maxVolume * tick;
          return (
            <View key={`volume-${tick}`} style={[styles.gridRow, { top }]}>
              <View style={styles.gridLineMuted} />
              <Text style={styles.gridLabelMuted}>{fmtVolume(volume)}</Text>
            </View>
          );
        })}
      </View>

      <Canvas style={{ width, height }}>
        {geometry.overlayPaths.map((overlay) => (
          <Path key={overlay.key} path={overlay.path} color={overlay.color} style="stroke" strokeWidth={overlay.strokeWidth} />
        ))}

        {geometry.candles.map((candle) => {
          const color = candle.isUp ? upColor : downColor;
          return (
            <React.Fragment key={candle.index}>
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
            <Circle cx={activeCandle.centerX} cy={activeCandle.closeY} r={2.2} color={activeCandle.isUp ? upColor : downColor} />
          </>
        ) : null}
      </Canvas>

      {activeCandle ? (
        <>
          <View pointerEvents="none" style={[styles.floatingPriceTag, { top: activeCandle.closeY - 12 }]}>
            <Text style={styles.floatingPriceText}>
              {fmtPrice(getNumericValue(activeCandle.datum, closeKey, activeCandle.index))}
            </Text>
          </View>
          <View pointerEvents="none" style={[styles.floatingDateTag, { left: activeCandle.centerX - 34 }]}>
            <Text style={styles.floatingDateText}>
              {labelKey ? getCategoryValue(activeCandle.datum, labelKey, activeCandle.index) : `#${activeCandle.index}`}
            </Text>
          </View>
        </>
      ) : null}

      {activeCandle ? (
        <View pointerEvents="none" style={styles.legendHudRow}>
          <View style={styles.legendHud}>
            <Text style={styles.legendHudText}>
              {labelKey ? getCategoryValue(activeCandle.datum, labelKey, activeCandle.index) : `#${activeCandle.index}`}
              {'  O '}
              {fmtPrice(getNumericValue(activeCandle.datum, openKey, activeCandle.index))}
              {'  H '}
              {fmtPrice(getNumericValue(activeCandle.datum, highKey, activeCandle.index))}
              {'  L '}
              {fmtPrice(getNumericValue(activeCandle.datum, lowKey, activeCandle.index))}
              {'  C '}
              {fmtPrice(getNumericValue(activeCandle.datum, closeKey, activeCandle.index))}
              {'  V '}
              {fmtVolume(getNumericValue(activeCandle.datum, volumeKey, activeCandle.index))}
            </Text>
          </View>
        </View>
      ) : null}

      <View pointerEvents="none" style={styles.legendRow}>
        {geometry.overlayPaths.map((overlay) => (
          <View key={overlay.key} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: overlay.color }]} />
            <Text style={styles.legendText}>{overlay.label}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: upColor }]} />
          <Text style={styles.legendText}>Volume</Text>
        </View>
      </View>

      <View pointerEvents="none" style={styles.bottomLabelRow}>
        {geometry.labels.map((label) => (
          <Text key={`${label.index}-axis`} style={[styles.bottomLabel, { left: label.centerX - 20 }]}>
            {labelKey ? getCategoryValue(label.datum, labelKey, label.index) : `#${label.index}`}
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
}

export const CandlestickChart = React.memo(CandlestickChartComponent) as typeof CandlestickChartComponent;

const styles = StyleSheet.create({
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
});
