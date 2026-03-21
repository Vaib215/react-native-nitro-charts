import React from 'react';
import { View } from 'react-native';
import { Canvas, Path } from '@shopify/react-native-skia';

import { computeAreaGeometry } from '../headless/models';
import { toSkiaColor } from './shared';
import type { CartesianChartProps } from '../types';

function AreaChartComponent<T>(props: CartesianChartProps<T>) {
  const geometry = React.useMemo(() => computeAreaGeometry(props), [props]);
  const color = toSkiaColor(props.color, '#2563eb');
  const progress = Math.max(0, Math.min(props.progress ?? 1, 1));

  return (
    <View style={props.style}>
      <Canvas style={{ width: props.width, height: props.height }}>
        <Path path={geometry.path} color={color} opacity={0.25} start={0} end={progress} />
      </Canvas>
    </View>
  );
}

export const AreaChart = React.memo(AreaChartComponent) as typeof AreaChartComponent;
