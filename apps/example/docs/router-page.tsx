import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export function RouterPage({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  inner: {
    gap: 16,
  },
});
