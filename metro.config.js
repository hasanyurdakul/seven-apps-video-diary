// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
// eslint-disable-next-line no-undef
const config = {
    watchFolders: [
      path.resolve(__dirname, './ffmpeg-kit/react-native'),
    ],
    resolver: {
      extraNodeModules: {
        'react-native': path.resolve(__dirname, 'node_modules/react-native'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        '@babel/runtime': path.resolve(__dirname, 'node_modules/@babel/runtime'),
      },
      blockList: [
        /.*\/ffmpeg-kit\/react-native\/node_modules\/.*/,
      ],
    },
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          inlineRequires: true,
        },
      }),
    },
  };

module.exports = withNativeWind(config, { input: './global.css' });
