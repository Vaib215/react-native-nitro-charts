import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Group, Path } from '@shopify/react-native-skia';

import { useDonutChart } from '../hooks';
import { toSkiaColor } from './shared';
import type { DonutChartProps } from '../types';

function DonutChartComponent(props: DonutChartProps) {
  const { slices, getSliceAt } = useDonutChart(props);
  const centerX = props.width / 2;
  const centerY = props.height / 2;
  const progress = Math.max(0, Math.min(props.progress ?? 1, 1));
  const scale = 0.86 + progress * 0.14;
  const [selectionProgress, setSelectionProgress] = React.useState(1);
  const [previousSelectedIndex, setPreviousSelectedIndex] = React.useState<number | null | undefined>(props.selectedIndex);
  const selectedIndexRef = React.useRef<number | null | undefined>(props.selectedIndex);

  React.useEffect(() => {
    if (selectedIndexRef.current === props.selectedIndex) {
      return;
    }

    setPreviousSelectedIndex(selectedIndexRef.current);
    selectedIndexRef.current = props.selectedIndex;
    setSelectionProgress(0);

    let frame = 0;
    const startedAt = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const eased = 1 - Math.pow(1 - Math.min(elapsed / 220, 1), 3);
      setSelectionProgress(eased);
      if (eased < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setPreviousSelectedIndex(props.selectedIndex);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [props.selectedIndex]);

  const handlePress = React.useCallback(
    (x: number, y: number) => {
      const slice = getSliceAt(x, y);
      if (slice) {
        props.onSlicePress?.(props.data[slice.index], slice.index);
      }
    },
    [getSliceAt, props]
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
        <Group transform={[{ translateX: centerX }, { translateY: centerY }, { scale }]}>
          {slices.map((slice, index) => {
            const isSelected = props.selectedIndex === index;
            const isPrevious = previousSelectedIndex === index && previousSelectedIndex !== props.selectedIndex;
            const emphasis = isSelected ? selectionProgress : isPrevious ? 1 - selectionProgress : 0;
            const midAngle = (slice.startAngle + slice.endAngle) / 2;
            const dx = Math.cos(midAngle) * 8 * emphasis;
            const dy = Math.sin(midAngle) * 8 * emphasis;
            const sliceScale = 1 + 0.08 * emphasis;
            return (
              <React.Fragment key={`${slice.label}-${index}`}>
                <Group transform={[{ translateX: dx }, { translateY: dy }, { scale: sliceScale }]}>
                  <Path
                    path={slice.path}
                    color={toSkiaColor(slice.color, '#7c3aed')}
                    opacity={(props.selectedIndex == null || props.selectedIndex === index ? 1 : 0.45) * (0.35 + progress * 0.65)}
                  />
                </Group>
              </React.Fragment>
            );
          })}
        </Group>
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

export const DonutChart = React.memo(DonutChartComponent);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
