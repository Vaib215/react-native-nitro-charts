import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';

import { useBarChart } from '../hooks';
import { toSkiaColor } from './shared';
import type { BarChartProps } from '../types';

function BarChartComponent<T>(props: BarChartProps<T>) {
  const { bars, getBarAt } = useBarChart(props);
  const color = toSkiaColor(props.color, '#ea580c');
  const progress = Math.max(0, Math.min(props.progress ?? 1, 1));

  const handlePress = React.useCallback(
    (x: number, y: number) => {
      const bar = getBarAt(x, y);
      if (bar) {
        props.onBarPress?.(bar.datum, bar.index);
      }
    },
    [getBarAt, props]
  );

  const handleResponderEvent = React.useCallback(
    (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      handlePress(event.nativeEvent.locationX, event.nativeEvent.locationY);
    },
    [handlePress]
  );

  return (
    <View style={[styles.container, { width: props.width, height: props.height }, props.style]}>
      <Canvas style={{ width: props.width, height: props.height }}>
        {bars.map((bar, index) => (
          <React.Fragment key={`${bar.label}-${index}`}>
            <Rect
              x={bar.x}
              y={bar.y + bar.height * (1 - progress)}
              width={bar.width}
              height={bar.height * progress}
              color={props.selectedIndex === bar.index ? '#ffe7c2' : color}
            />
          </React.Fragment>
        ))}
      </Canvas>
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleResponderEvent}
        onResponderMove={handleResponderEvent}
      />
    </View>
  );
}

export const BarChart = React.memo(BarChartComponent) as typeof BarChartComponent;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
