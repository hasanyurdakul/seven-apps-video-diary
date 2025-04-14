// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add ffmpeg-kit configuration
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, './ffmpeg-kit/react-native'),
];

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    'react-native': path.resolve(__dirname, 'node_modules/react-native'),
    'react': path.resolve(__dirname, 'node_modules/react'),
    '@babel/runtime': path.resolve(__dirname, 'node_modules/@babel/runtime'),
  },
  blockList: [
    /.*\/ffmpeg-kit\/react-native\/node_modules\/.*/,
  ],
};

config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      inlineRequires: true,
    },
  }),
};

module.exports = withNativeWind(config, { input: './global.css' });
