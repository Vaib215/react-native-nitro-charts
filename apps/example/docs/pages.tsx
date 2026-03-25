import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BarChart, DonutChart, LineChart } from 'react-native-nitro-charts';

import { barData, donutData, hooksSnippet, installSnippet, lineData, quickStartData, quickStartSnippet, ranges } from './content';
import { CodeBlock, InlineCode, KeyValueList, PageSection, Panel, PanelTitle, docsStyles } from './shared';
import { useChartEntrance } from './use-chart-entrance';
import StockCandlesScreen from '../stock-candles-screen';

export type DocsPageKey =
  | 'overview'
  | 'installation'
  | 'quick-start'
  | 'components'
  | 'hooks'
  | 'runtime'
  | 'examples'
  | 'development'
  | 'stock-candles';

export const docsPages: Array<{ key: DocsPageKey; label: string; group: 'Docs' | 'Examples' }> = [
  { key: 'overview', label: 'Overview', group: 'Docs' },
  { key: 'installation', label: 'Installation', group: 'Docs' },
  { key: 'quick-start', label: 'Quick Start', group: 'Docs' },
  { key: 'components', label: 'Components', group: 'Docs' },
  { key: 'hooks', label: 'Hooks', group: 'Docs' },
  { key: 'runtime', label: 'Runtime', group: 'Docs' },
  { key: 'examples', label: 'Examples', group: 'Docs' },
  { key: 'development', label: 'Development', group: 'Docs' },
  { key: 'stock-candles', label: 'Stock Candles', group: 'Examples' },
];

export function OverviewPage() {
  return (
    <PageSection
      title="Overview"
      description="Core concepts, scope, and what the library includes today."
    >
      <Panel>
        <Text style={styles.lead}>
          <Text style={styles.leadStrong}>react-native-nitro-charts</Text> is a small charting library for Expo and
          React Native apps. It ships interactive components, headless hooks, and a runtime model that works on web and
          native.
        </Text>
        <KeyValueList
          items={[
            { label: 'Package', value: 'react-native-nitro-charts' },
            { label: 'Current version', value: '0.0.1' },
            { label: 'Charts', value: 'Line, Area, Bar, Donut, Candlestick' },
            { label: 'Rendering', value: 'React Native Skia' },
            { label: 'Geometry', value: 'D3 + headless helpers' },
            { label: 'Native engine', value: 'Nitro on iOS and Android' },
          ]}
        />
      </Panel>
    </PageSection>
  );
}

export function InstallationPage() {
  return (
    <PageSection
      title="Installation"
      description="Install the package and understand how it runs across web and native."
    >
      <Panel>
        <PanelTitle>Install package and peers</PanelTitle>
        <CodeBlock code={installSnippet} />
      </Panel>
      <Panel>
        <PanelTitle>Notes</PanelTitle>
        <View style={styles.list}>
          <Text style={styles.listItem}>Use Expo web for browser testing.</Text>
          <Text style={styles.listItem}>Use a development build on iOS and Android when you want the Nitro-native path.</Text>
          <Text style={styles.listItem}>The package falls back to a TypeScript engine when native Nitro is unavailable.</Text>
        </View>
      </Panel>
    </PageSection>
  );
}

export function QuickStartPage({ width }: { width: number }) {
  const [activeLabel, setActiveLabel] = React.useState('Move over the chart to inspect a point');
  const progress = useChartEntrance([]);
  const chartWidth = Math.min(width - 48, 760);

  return (
    <PageSection
      title="Quick Start"
      description="Minimal setup with a live line-chart example."
    >
      <Panel>
        <PanelTitle>Basic usage</PanelTitle>
        <CodeBlock code={quickStartSnippet} />
      </Panel>
      <Panel>
        <View style={styles.exampleHeader}>
          <PanelTitle>Live example</PanelTitle>
          <Text style={styles.exampleMeta}>{activeLabel}</Text>
        </View>
        <LineChart
          data={quickStartData}
          xKey="timestamp"
          yKey="value"
          width={chartWidth}
          height={260}
          color="#0f766e"
          downsampleTo={120}
          progress={progress}
          onActivePointChange={(datum) =>
            setActiveLabel(datum ? `timestamp=${datum.timestamp}, value=${datum.value.toFixed(1)}` : 'Move over the chart to inspect a point')
          }
        />
      </Panel>
    </PageSection>
  );
}

export function ComponentsPage() {
  return (
    <PageSection
      title="Components"
      description="The primary component surface exported by the package."
    >
      <View style={styles.stack}>
        <View style={styles.apiCard}>
          <Text style={styles.apiTitle}>LineChart</Text>
          <Text style={styles.apiDescription}>Interactive cartesian line chart with cursor support and optional downsampling.</Text>
          <Text style={styles.apiProps}>Props: <InlineCode>data</InlineCode>, <InlineCode>xKey</InlineCode>, <InlineCode>yKey</InlineCode>, <InlineCode>width</InlineCode>, <InlineCode>height</InlineCode>, <InlineCode>downsampleTo</InlineCode>, <InlineCode>onActivePointChange</InlineCode></Text>
        </View>
        <View style={styles.apiCard}>
          <Text style={styles.apiTitle}>AreaChart</Text>
          <Text style={styles.apiDescription}>Filled cartesian area chart using the same data contract as the line chart.</Text>
          <Text style={styles.apiProps}>Props: <InlineCode>data</InlineCode>, <InlineCode>xKey</InlineCode>, <InlineCode>yKey</InlineCode>, <InlineCode>width</InlineCode>, <InlineCode>height</InlineCode>, <InlineCode>progress</InlineCode></Text>
        </View>
        <View style={styles.apiCard}>
          <Text style={styles.apiTitle}>BarChart</Text>
          <Text style={styles.apiDescription}>Categorical comparison chart with press selection.</Text>
          <Text style={styles.apiProps}>Props: <InlineCode>data</InlineCode>, <InlineCode>categoryKey</InlineCode>, <InlineCode>valueKey</InlineCode>, <InlineCode>selectedIndex</InlineCode>, <InlineCode>onBarPress</InlineCode></Text>
        </View>
        <View style={styles.apiCard}>
          <Text style={styles.apiTitle}>DonutChart</Text>
          <Text style={styles.apiDescription}>Part-to-whole chart with slice hit testing and selection.</Text>
          <Text style={styles.apiProps}>Props: <InlineCode>data</InlineCode>, <InlineCode>innerRadius</InlineCode>, <InlineCode>outerRadius</InlineCode>, <InlineCode>selectedIndex</InlineCode>, <InlineCode>onSlicePress</InlineCode></Text>
        </View>
        <View style={styles.apiCard}>
          <Text style={styles.apiTitle}>CandlestickChart</Text>
          <Text style={styles.apiDescription}>Interactive OHLCV candlestick chart with volume bars, SMA overlays, crosshair inspection, and pinch-to-zoom.</Text>
          <Text style={styles.apiProps}>Props: <InlineCode>data</InlineCode>, <InlineCode>openKey</InlineCode>, <InlineCode>highKey</InlineCode>, <InlineCode>lowKey</InlineCode>, <InlineCode>closeKey</InlineCode>, <InlineCode>volumeKey</InlineCode>, <InlineCode>labelKey</InlineCode>, <InlineCode>overlays</InlineCode>, <InlineCode>onPinchZoom</InlineCode></Text>
        </View>
        <View style={styles.apiCard}>
          <Text style={styles.apiTitle}>CandlestickNavigator</Text>
          <Text style={styles.apiDescription}>Timeline range selector with sparkline overview and draggable viewport handles for panning and resizing.</Text>
          <Text style={styles.apiProps}>Props: <InlineCode>data</InlineCode>, <InlineCode>closeKey</InlineCode>, <InlineCode>labelKey</InlineCode>, <InlineCode>start</InlineCode>, <InlineCode>end</InlineCode>, <InlineCode>onPanWindow</InlineCode>, <InlineCode>onResizeWindow</InlineCode></Text>
        </View>
      </View>
    </PageSection>
  );
}

export function HooksPage() {
  return (
    <PageSection
      title="Hooks"
      description="Headless APIs for custom renderers and interactions."
    >
      <Panel>
        <PanelTitle>Headless hooks</PanelTitle>
        <CodeBlock code={hooksSnippet} />
      </Panel>
      <Panel>
        <View style={styles.list}>
          <Text style={styles.listItem}><InlineCode>useLineChart</InlineCode> and <InlineCode>useAreaChart</InlineCode> return geometry for custom rendering.</Text>
          <Text style={styles.listItem}><InlineCode>useBarChart</InlineCode> and <InlineCode>useDonutChart</InlineCode> return geometry plus hit-testing helpers.</Text>
          <Text style={styles.listItem}><InlineCode>useNearestPoint</InlineCode> resolves the closest rendered point for cursor or tooltip UIs.</Text>
          <Text style={styles.listItem}><InlineCode>useChartPressState</InlineCode> stores the active item with transition-friendly updates.</Text>
          <Text style={styles.listItem}><InlineCode>useChartEntrance</InlineCode> animates a progress value from 0 to 1 for chart reveal animations.</Text>
        </View>
      </Panel>
    </PageSection>
  );
}

export function RuntimePage() {
  return (
    <PageSection
      title="Runtime"
      description="How the engine behaves across environments."
    >
      <View style={styles.stack}>
        <View style={styles.apiCard}>
          <Text style={styles.apiTitle}>typescript-web</Text>
          <Text style={styles.apiDescription}>Used on web.</Text>
        </View>
        <View style={styles.apiCard}>
          <Text style={styles.apiTitle}>native-nitro</Text>
          <Text style={styles.apiDescription}>Used on iOS and Android when the native module is available.</Text>
        </View>
        <View style={styles.apiCard}>
          <Text style={styles.apiTitle}>typescript-fallback</Text>
          <Text style={styles.apiDescription}>Used when the native engine is unavailable.</Text>
        </View>
      </View>
    </PageSection>
  );
}

export function ExamplesPage({ width }: { width: number }) {
  const [selectedRange, setSelectedRange] = React.useState<(typeof ranges)[number]['key']>('7D');
  const [selectedBar, setSelectedBar] = React.useState(3);
  const [selectedSlice, setSelectedSlice] = React.useState(0);
  const [cursor, setCursor] = React.useState('No point selected');
  const progress = useChartEntrance([selectedRange]);
  const rangeConfig = ranges.find((range) => range.key === selectedRange) ?? ranges[1];
  const currentLineData = React.useMemo(() => lineData.slice(0, rangeConfig.points), [rangeConfig.points]);
  const lineWidth = Math.min(width - 48, 760);
  const smallChartWidth = Math.min(width - 64, 360);

  return (
    <PageSection
      title="Examples"
      description="Functional examples for line, bar, and donut charts."
    >
      <Panel>
        <View style={styles.exampleToolbar}>
          <View>
            <PanelTitle>Line example</PanelTitle>
            <Text style={styles.exampleMeta}>{cursor}</Text>
          </View>
          <View style={styles.segmentRow}>
            {ranges.map((range) => {
              const active = range.key === selectedRange;
              return (
                <Pressable key={range.key} onPress={() => setSelectedRange(range.key)} style={[styles.segment, active && styles.segmentActive]}>
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{range.key}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <LineChart
          data={currentLineData}
          xKey="x"
          yKey="y"
          width={lineWidth}
          height={280}
          color="#0f766e"
          downsampleTo={600}
          progress={progress}
          onActivePointChange={(datum) => setCursor(datum ? `x=${datum.x}, y=${datum.y.toFixed(1)}` : 'No point selected')}
        />
      </Panel>

      <View style={styles.grid}>
        <View style={styles.panelCompact}>
          <PanelTitle>Bar example</PanelTitle>
          <Text style={styles.exampleMeta}>Tap or drag across the bars. Selected: {barData[selectedBar]?.label} {barData[selectedBar]?.value}%</Text>
          <BarChart
            data={barData}
            categoryKey="label"
            valueKey="value"
            width={smallChartWidth}
            height={220}
            color="#b45309"
            progress={1}
            selectedIndex={selectedBar}
            onBarPress={(_, index) => setSelectedBar(index)}
          />
        </View>

        <View style={styles.panelCompact}>
          <PanelTitle>Donut example</PanelTitle>
          <Text style={styles.exampleMeta}>Tap or drag across the donut. Selected: {donutData[selectedSlice]?.label}</Text>
          <DonutChart
            data={donutData}
            width={220}
            height={220}
            selectedIndex={selectedSlice}
            progress={1}
            onSlicePress={(_, index) => setSelectedSlice(index)}
          />
        </View>
      </View>
    </PageSection>
  );
}

export function DevelopmentPage() {
  return (
    <PageSection
      title="Development"
      description="Useful repository commands while working on the library."
    >
      <Panel>
        <PanelTitle>Repository commands</PanelTitle>
        <View style={styles.list}>
          <Text style={styles.listItem}><InlineCode>bun run build</InlineCode> builds the package.</Text>
          <Text style={styles.listItem}><InlineCode>bun run typecheck</InlineCode> runs workspace type checks.</Text>
          <Text style={styles.listItem}><InlineCode>bun test</InlineCode> runs the test suite.</Text>
          <Text style={styles.listItem}><InlineCode>bun run example</InlineCode> starts the example app.</Text>
          <Text style={styles.listItem}><InlineCode>bun run example:web</InlineCode> runs the example app on web.</Text>
        </View>
      </Panel>
    </PageSection>
  );
}

export function StockCandlesPage() {
  return <StockCandlesScreen />;
}

const styles = StyleSheet.create({
  ...docsStyles,
  stack: {
    gap: 16,
  },
  lead: {
    color: '#33424d',
    fontSize: 16,
    lineHeight: 24,
  },
  leadStrong: {
    color: '#0f1720',
    fontWeight: '700',
  },
  list: {
    gap: 8,
  },
  listItem: {
    color: '#33424d',
    fontSize: 14,
    lineHeight: 22,
  },
  exampleHeader: {
    gap: 4,
  },
  exampleToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  exampleMeta: {
    color: '#5f6c76',
    fontSize: 13,
    lineHeight: 18,
  },
  apiCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e3e8eb',
    gap: 8,
  },
  apiTitle: {
    color: '#0f1720',
    fontSize: 17,
    fontWeight: '700',
  },
  apiDescription: {
    color: '#42525d',
    fontSize: 14,
    lineHeight: 21,
  },
  apiProps: {
    color: '#33424d',
    fontSize: 14,
    lineHeight: 21,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f6f7',
    borderWidth: 1,
    borderColor: '#d9e1e5',
  },
  segmentActive: {
    backgroundColor: '#e6f2ef',
    borderColor: '#bcd9d4',
  },
  segmentText: {
    color: '#42525d',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#0f766e',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  panelCompact: {
    flex: 1,
    minWidth: 280,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e3e8eb',
    gap: 14,
    alignItems: 'flex-start',
  },
});
