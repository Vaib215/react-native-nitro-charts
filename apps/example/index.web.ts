import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

LoadSkiaWeb({
  locateFile: (file) => `/${file}`,
}).then(() => {
  require('expo-router/entry');
});
