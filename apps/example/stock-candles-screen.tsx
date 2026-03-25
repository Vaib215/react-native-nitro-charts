import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { CandlestickChart, CandlestickNavigator, useChartEntrance } from 'react-native-nitro-charts';

type Candle = {
  timestamp: number;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateCandles(points: number) {
  const start = Date.UTC(2024, 0, 2);
  const candles: Candle[] = [];
  const rand = seededRandom(42);
  const gauss = () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  let previousClose = 182;
  let volatility = 0.018;
  let trendBias = 0.0004;

  for (let index = 0; index < points; index += 1) {
    if (rand() < 0.08) {
      trendBias = (rand() - 0.45) * 0.002;
    }
    if (rand() < 0.05) {
      volatility = 0.008 + rand() * 0.03;
    }

    const dailyReturn = trendBias + gauss() * volatility;
    const gap = gauss() * previousClose * 0.004;
    const open = previousClose + gap;
    const bodySize = Math.abs(gauss()) * previousClose * volatility * 0.9;
    const direction = rand() < (0.5 + trendBias * 80) ? 1 : -1;
    const close = open + direction * bodySize + dailyReturn * previousClose;

    const upperWick = Math.abs(gauss()) * previousClose * volatility * 0.7;
    const lowerWick = Math.abs(gauss()) * previousClose * volatility * 0.7;
    const high = Math.max(open, close) + upperWick;
    const low = Math.min(open, close) - lowerWick;

    const baseVolume = 8_000_000 + gauss() * 3_000_000;
    const spike = rand() < 0.07 ? 2 + rand() * 3 : 1;
    const bigMoveBoost = Math.abs(dailyReturn) > 0.02 ? 1.8 : 1;
    const volume = Math.max(500_000, Math.round(baseVolume * spike * bigMoveBoost));

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

const OVERLAYS = [
  { window: 9, color: '#f59e0b', label: 'SMA 9' },
  { window: 21, color: '#60a5fa', label: 'SMA 21' },
];

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
  const progress = useChartEntrance([]);

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

          <CandlestickChart
            data={visibleData}
            width={chartWidth - 36}
            height={chartHeight}
            openKey="open"
            highKey="high"
            lowKey="low"
            closeKey="close"
            volumeKey="volume"
            labelKey="label"
            progress={progress}
            overlays={OVERLAYS}
            onPinchZoom={pinchZoom}
            formatPriceLabel={formatMoney}
            formatVolumeLabel={formatCompactVolume}
          />

          <CandlestickNavigator
            data={allData}
            width={chartWidth - 36}
            start={viewport.start}
            end={viewport.end}
            closeKey="close"
            labelKey="label"
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
