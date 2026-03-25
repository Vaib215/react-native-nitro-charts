import React from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { Canvas, Path } from '@shopify/react-native-skia';

import { computeCandlestickNavigatorGeometry } from '../headless/models';
import { getNumericValue, getCategoryValue } from '../utils/accessors';
import type { CandlestickNavigatorProps } from '../types';

function CandlestickNavigatorComponent<T>(props: CandlestickNavigatorProps<T>) {
  const { data, width, start, end, closeKey, labelKey, style, onPanWindow, onResizeWindow } = props;

  const nav = React.useMemo(
    () => computeCandlestickNavigatorGeometry({ data, width, start, end, closeKey, labelKey }),
    [data, width, start, end, closeKey, labelKey]
  );

  const timeMarkers = React.useMemo(() => {
    return data.filter((_, index) => {
      if (index === 0 || index === data.length - 1) return true;
      return index === Math.floor((data.length - 1) / 3) || index === Math.floor(((data.length - 1) * 2) / 3);
    });
  }, [data]);

  const dragMode = React.useRef<'window' | 'left' | 'right' | null>(null);

  const pickDragMode = React.useCallback(
    (locationX: number) => {
      const leftHandleX = nav.viewportLeft;
      const rightHandleX = nav.viewportLeft + nav.viewportWidth;
      if (Math.abs(locationX - leftHandleX) <= 18) return 'left' as const;
      if (Math.abs(locationX - rightHandleX) <= 18) return 'right' as const;
      return 'window' as const;
    },
    [nav.viewportLeft, nav.viewportWidth]
  );

  const indexFromLocation = React.useCallback(
    (locationX: number) => {
      const ratio = Math.max(0, Math.min(1, (locationX - 12) / nav.usableWidth));
      return Math.round(ratio * data.length);
    },
    [data.length, nav.usableWidth]
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
          if (!dragMode.current) return;
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
    <View style={[styles.navigator, { width }, style]}>
      <View style={styles.navigatorGlow} />
      <Canvas style={{ width, height: 56 }}>
        <Path path={nav.sparklinePath} color="#7dd3fc" style="stroke" strokeWidth={1.6} />
      </Canvas>
      <View style={[styles.navigatorViewport, { left: nav.viewportLeft, width: nav.viewportWidth }]} />
      <View style={[styles.navigatorHandle, styles.navigatorHandleLeft, { left: nav.viewportLeft - 7 }]} />
      <View style={[styles.navigatorHandle, styles.navigatorHandleRight, { left: nav.viewportLeft + nav.viewportWidth - 7 }]} />
      <View pointerEvents="none" style={styles.navigatorScale}>
        {timeMarkers.map((item, index) => {
          const ratio = index === 0 ? 0 : index === timeMarkers.length - 1 ? 1 : index === 1 ? 1 / 3 : 2 / 3;
          const left = 12 + ratio * nav.usableWidth;
          return (
            <View key={`marker-${index}`} style={[styles.navigatorMarker, { left: left - 20 }]}>
              <View style={styles.navigatorMarkerTick} />
              <Text style={styles.navigatorMarkerText}>
                {labelKey ? getCategoryValue(item, labelKey, index) : `#${index}`}
              </Text>
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
          if (!dragMode.current) return;
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
}

export const CandlestickNavigator = React.memo(CandlestickNavigatorComponent) as typeof CandlestickNavigatorComponent;

const styles = StyleSheet.create({
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
});
