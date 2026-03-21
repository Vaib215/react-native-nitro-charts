export const installSnippet = `bun add react-native-nitro-charts @shopify/react-native-skia react-native-nitro-modules d3-array d3-scale d3-shape`;

export const quickStartSnippet = `import * as React from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-nitro-charts';

const series = Array.from({ length: 120 }, (_, index) => ({
  timestamp: index,
  value: 100 + Math.sin(index / 10) * 18,
}));

export function RevenueChart() {
  const [active, setActive] = React.useState(null);

  return (
    <View>
      <LineChart
        data={series}
        xKey="timestamp"
        yKey="value"
        width={720}
        height={280}
        color="#0f766e"
        downsampleTo={400}
        onActivePointChange={(datum) => setActive(datum)}
      />
    </View>
  );
}`;

export const hooksSnippet = `import { useBarChart, useChartPressState } from 'react-native-nitro-charts';

const { activeItem, setActiveItem } = useChartPressState();
const { bars, getBarAt } = useBarChart({
  data,
  categoryKey: 'label',
  valueKey: 'value',
  width: 360,
  height: 220,
});

const hit = getBarAt(x, y);
if (hit) {
  setActiveItem(hit.datum);
}`;

export const lineData = Array.from({ length: 10000 }, (_, index) => ({
  x: index,
  y: 100 + Math.sin(index / 120) * 45 + Math.cos(index / 18) * 10,
}));

export const quickStartData = Array.from({ length: 180 }, (_, index) => ({
  timestamp: index,
  value: 100 + Math.sin(index / 8.2) * 22 + Math.cos(index / 19) * 9,
}));

export const barData = [
  { label: 'Mon', value: 12 },
  { label: 'Tue', value: 18 },
  { label: 'Wed', value: 9 },
  { label: 'Thu', value: 24 },
  { label: 'Fri', value: 20 },
];

export const donutData = [
  { label: 'Search', value: 38, color: '#0f766e' },
  { label: 'Referral', value: 24, color: '#2563eb' },
  { label: 'Social', value: 18, color: '#f97316' },
  { label: 'Direct', value: 20, color: '#7c3aed' },
];

export const ranges = [
  { key: '1D', points: 180 },
  { key: '7D', points: 900 },
  { key: '30D', points: 3000 },
] as const;
