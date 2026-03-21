# react-native-nitro-charts

High-performance chart primitives for Expo and React Native, built with Skia, D3, and Nitro.

`react-native-nitro-charts` gives you ready-to-use chart components plus headless geometry utilities when you need to build your own chart interactions or layouts.

## Features

- Skia-powered rendering
- Hooks-first API for derived geometry
- Interactive line, area, bar, and donut charts
- Native Nitro engine for hot paths on iOS and Android
- TypeScript fallback engine for web and unsupported native environments
- Headless helpers for custom chart experiences

## Installation

Install the package and its required peers:

```bash
bun add react-native-nitro-charts @shopify/react-native-skia react-native-nitro-modules d3-array d3-scale d3-shape
```

If you use npm:

```bash
npm install react-native-nitro-charts @shopify/react-native-skia react-native-nitro-modules d3-array d3-scale d3-shape
```

### Peer dependencies

- `expo`
- `react`
- `react-native`
- `@shopify/react-native-skia`

### Native builds

On iOS and Android, the package will use the Nitro-native engine when available. If the native engine is not available, it falls back to the TypeScript implementation.

For managed Expo apps, use a development build when you want the native path available.

## Quick Start

```tsx
import * as React from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-nitro-charts';

const series = Array.from({ length: 120 }, (_, index) => ({
  timestamp: index,
  value: 100 + Math.sin(index / 10) * 18,
}));

export function RevenueChart() {
  const [active, setActive] = React.useState<(typeof series)[number] | null>(null);

  return (
    <View>
      <LineChart
        data={series}
        xKey="timestamp"
        yKey="value"
        width={720}
        height={280}
        color="#14b8a6"
        downsampleTo={400}
        onActivePointChange={(datum) => setActive(datum)}
      />
    </View>
  );
}
```

## Components

### `LineChart`

Best for time-series and continuous numeric data.

Key props:

- `data`
- `xKey`
- `yKey`
- `width`
- `height`
- `color`
- `strokeWidth`
- `progress`
- `padding`
- `downsampleTo`
- `onActivePointChange`

### `AreaChart`

Uses the same cartesian API as `LineChart`, but fills the area beneath the path.

### `BarChart`

For categorical comparisons.

Key props:

- `data`
- `categoryKey`
- `valueKey`
- `width`
- `height`
- `selectedIndex`
- `progress`
- `padding`
- `onBarPress`

### `DonutChart`

For part-to-whole visualizations.

Key props:

- `data`
- `width`
- `height`
- `innerRadius`
- `outerRadius`
- `padAngle`
- `selectedIndex`
- `progress`
- `onSlicePress`

## Hooks

### `useLineChart(props)`

Returns computed line geometry:

- `path`
- `points`

### `useAreaChart(props)`

Returns computed area geometry:

- `path`
- `points`

### `useBarChart(props)`

Returns:

- `bars`
- `getBarAt(x, y)`

### `useDonutChart(props)`

Returns:

- `slices`
- `getSliceAt(x, y)`

### `useNearestPoint(props, x, y?)`

Computes the nearest rendered point for a cartesian chart.

### `useChartPressState<T>()`

Tiny helper for storing the currently active datum with React transitions.

## Headless Utilities

The package also exports geometry helpers from `headless/models` for custom rendering and interaction layers:

- `computeLineGeometry`
- `computeAreaGeometry`
- `computeBarGeometry`
- `computeDonutGeometry`
- `findNearestPoint`
- `findNearestBar`
- `findNearestDonutSlice`

These are useful when you want the chart math without the built-in components.

## Engine Behavior

The exported `chartEngine` exposes:

- `downsampleSeries`
- `findNearestDatum`

Engine names you may observe:

- `native-nitro`
- `typescript-web`
- `typescript-fallback`

## Development

From the repository root:

```bash
bun install
bun run build
bun test
bun run example
```

## Contributing

See [CONTRIBUTING.md](/Users/vaib/Documents/Projects/codes/chart/CONTRIBUTING.md) for local setup, coding expectations, and pull request guidance.

## License

MIT. See [LICENSE](/Users/vaib/Documents/Projects/codes/chart/LICENSE).
