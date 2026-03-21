module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          'react-compiler': {},
        },
      ],
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
