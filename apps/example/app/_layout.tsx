import 'react-native-gesture-handler';

import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions } from 'react-native';

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  return (
    <>
      <StatusBar style="dark" />
      <Drawer
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#0f1720',
          headerTitleStyle: {
            fontWeight: '700',
          },
          sceneStyle: {
            backgroundColor: '#f5f7f8',
          },
          drawerType: isDesktop ? 'permanent' : 'front',
          swipeEnabled: !isDesktop,
          headerLeft: isDesktop ? () => null : undefined,
          drawerStyle: {
            width: 280,
            backgroundColor: '#ffffff',
          },
          drawerActiveTintColor: '#0f766e',
          drawerInactiveTintColor: '#42525d',
          drawerActiveBackgroundColor: '#e6f2ef',
          drawerItemStyle: {
            borderRadius: 12,
            marginHorizontal: 12,
            marginVertical: 4,
          },
          drawerLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            marginLeft: 0,
          },
        }}
      >
        <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
        <Drawer.Screen name="overview" options={{ title: 'Overview' }} />
        <Drawer.Screen name="installation" options={{ title: 'Installation' }} />
        <Drawer.Screen name="quick-start" options={{ title: 'Quick Start' }} />
        <Drawer.Screen name="components" options={{ title: 'Components' }} />
        <Drawer.Screen name="hooks" options={{ title: 'Hooks' }} />
        <Drawer.Screen name="runtime" options={{ title: 'Runtime' }} />
        <Drawer.Screen name="examples" options={{ title: 'Examples' }} />
        <Drawer.Screen name="development" options={{ title: 'Development' }} />
        <Drawer.Screen name="stock-candles" options={{ title: 'Stock Candles' }} />
      </Drawer>
    </>
  );
}
