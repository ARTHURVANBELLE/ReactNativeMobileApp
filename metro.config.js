// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Use simple CSS transformer without NativeWind specific config
config.transformer.babelTransformerPath = require.resolve('react-native-css-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'css');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'css'];

module.exports = config;
