const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react/jsx-runtime': path.resolve(projectRoot, 'node_modules/react/jsx-runtime.js'),
  'react/jsx-dev-runtime': path.resolve(projectRoot, 'node_modules/react/jsx-dev-runtime.js'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  expo: path.resolve(projectRoot, 'node_modules/expo'),
  '@shopify/react-native-skia': path.resolve(projectRoot, 'node_modules/@shopify/react-native-skia'),
  'react-native-gesture-handler': path.resolve(projectRoot, 'node_modules/react-native-gesture-handler'),
  'react-native-reanimated': path.resolve(projectRoot, 'node_modules/react-native-reanimated'),
  'react-native-safe-area-context': path.resolve(projectRoot, 'node_modules/react-native-safe-area-context'),
  'react-native-screens': path.resolve(projectRoot, 'node_modules/react-native-screens'),
  'react-native-worklets': path.resolve(projectRoot, 'node_modules/react-native-worklets'),
};

module.exports = config;
