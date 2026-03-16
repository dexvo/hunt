module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@lib': './src/lib',
            '@store': './src/store',
            '@types': './src/types',
            '@components': './src/components',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@constants': './src/constants',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
