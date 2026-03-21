import React from 'react';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';
import { Canvas, Circle, Line as SkiaLine, Path } from '@shopify/react-native-skia';

import { DEFAULT_STROKE_WIDTH } from '../constants';
import { computeLineGeometry } from '../headless/models';
import { findNearestPoint } from '../headless/models';
import { toSkiaColor } from './shared';
import type { CartesianChartProps } from '../types';

function LineChartComponent<T>(props: CartesianChartProps<T>) {
  const {
    color: colorProp,
    data,
    downsampleTo,
    height,
    onActivePointChange,
    padding,
    progress: progressProp,
    strokeWidth,
    style,
    width,
    xKey,
    yKey,
  } = props;
  const onActivePointChangeRef = React.useRef(onActivePointChange);
  onActivePointChangeRef.current = onActivePointChange;

  const geometry = React.useMemo(
    () =>
      computeLineGeometry({
        data,
        xKey,
        yKey,
        width,
        height,
        padding,
        color: colorProp,
        strokeWidth,
        style,
        downsampleTo,
      }),
    [colorProp, data, downsampleTo, height, padding, strokeWidth, style, width, xKey, yKey]
  );
  const [activeIndex, setActiveIndex] = React.useState<number>(Math.max(geometry.points.length - 1, 0));
  const progress = Math.max(0, Math.min(progressProp ?? 1, 1));

  const setNearestPoint = React.useCallback(
    (x: number, y: number | undefined, active: boolean) => {
      if (geometry.points.length === 0) {
        onActivePointChangeRef.current?.(null, { active, x: 0, y: 0 });
        return;
      }

      const nearest = findNearestPoint(
        geometry.points.map((point) => ({ x: point.x, y: point.y })),
        x,
        y
      );

      if (nearest.index < 0 || !nearest.point) {
        onActivePointChangeRef.current?.(null, { active, x: 0, y: 0 });
        return;
      }

      setActiveIndex(nearest.index);
      onActivePointChangeRef.current?.(geometry.points[nearest.index]?.datum ?? null, {
        active,
        x: nearest.point.x,
        y: nearest.point.y,
      });
    },
    [geometry.points]
  );

  React.useEffect(() => {
    if (geometry.points.length === 0) {
      return;
    }

    setActiveIndex(Math.max(geometry.points.length - 1, 0));
    const lastPoint = geometry.points[geometry.points.length - 1];
    onActivePointChangeRef.current?.(lastPoint?.datum ?? null, {
      active: false,
      x: lastPoint?.x ?? 0,
      y: lastPoint?.y ?? 0,
    });
  }, [geometry.points]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          setNearestPoint(event.nativeEvent.locationX, undefined, true);
        },
        onPanResponderMove: (event) => {
          setNearestPoint(event.nativeEvent.locationX, undefined, true);
        },
        onPanResponderRelease: (event) => {
          setNearestPoint(event.nativeEvent.locationX, undefined, false);
        },
        onPanResponderTerminate: (event) => {
          setNearestPoint(event.nativeEvent.locationX, undefined, false);
        },
      }),
    [setNearestPoint]
  );

  const handlePointerEvent = React.useCallback(
    (event: { nativeEvent: { offsetX?: number; locationX?: number } }, active: boolean) => {
      const x = event.nativeEvent.offsetX ?? event.nativeEvent.locationX ?? 0;
      setNearestPoint(x, undefined, active);
    },
    [setNearestPoint]
  );

  const color = toSkiaColor(props.color, '#0f766e');
  const activePoint = geometry.points[activeIndex] ?? geometry.points[geometry.points.length - 1];
  const overlayStyle = React.useMemo(
    () => [StyleSheet.absoluteFill, Platform.OS === 'web' ? styles.overlayWeb : null],
    []
  );
  const gestureHandlers = Platform.OS === 'web' ? undefined : panResponder.panHandlers;

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Canvas style={{ width, height }}>
        {activePoint ? (
          <>
            <SkiaLine
              p1={{ x: activePoint.x, y: 0 }}
              p2={{ x: activePoint.x, y: height }}
              color="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />
            <SkiaLine
              p1={{ x: 0, y: activePoint.y }}
              p2={{ x: width, y: activePoint.y }}
              color="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          </>
        ) : null}
        <Path
          path={geometry.path}
          color={color}
          style="stroke"
          strokeWidth={strokeWidth ?? DEFAULT_STROKE_WIDTH}
          start={0}
          end={progress}
        />
        {activePoint ? <Circle cx={activePoint.x} cy={activePoint.y} r={6} color="rgba(255,255,255,0.2)" /> : null}
        {activePoint ? <Circle cx={activePoint.x} cy={activePoint.y} r={3.5} color={color} /> : null}
      </Canvas>
      <View
        style={overlayStyle}
        onPointerEnter={(event) => {
          handlePointerEvent(event, true);
        }}
        onPointerMove={(event) => {
          handlePointerEvent(event, true);
        }}
        onPointerLeave={(event) => {
          handlePointerEvent(event, false);
        }}
        {...gestureHandlers}
      />
    </View>
  );
}

export const LineChart = React.memo(LineChartComponent) as typeof LineChartComponent;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  overlayWeb: {
    cursor: 'pointer',
  },
});
