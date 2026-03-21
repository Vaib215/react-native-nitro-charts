import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'Courier',
});

export function PageSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function Panel({ children }: { children: React.ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.panelTitle}>{children}</Text>;
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <View style={styles.codeBlock}>
      <Text selectable style={styles.codeText}>
        {code}
      </Text>
    </View>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return <Text style={styles.inlineCode}>{children}</Text>;
}

export function KeyValueList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <View style={styles.kvList}>
      {items.map((item) => (
        <View key={item.label} style={styles.kvRow}>
          <Text style={styles.kvLabel}>{item.label}</Text>
          <Text style={styles.kvValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    color: '#0f1720',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  sectionDescription: {
    color: '#5f6c76',
    fontSize: 15,
    lineHeight: 22,
  },
  panel: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e3e8eb',
    gap: 14,
  },
  panelTitle: {
    color: '#0f1720',
    fontSize: 18,
    fontWeight: '700',
  },
  codeBlock: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f9fa',
    borderWidth: 1,
    borderColor: '#e5eaed',
  },
  codeText: {
    color: '#13212b',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: monoFamily,
  },
  inlineCode: {
    color: '#0f766e',
    fontFamily: monoFamily,
    fontSize: 12,
  },
  kvList: {
    gap: 0,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f3',
  },
  kvLabel: {
    color: '#5f6c76',
    fontSize: 14,
  },
  kvValue: {
    color: '#0f1720',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
});

export const docsStyles = styles;
