module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Remove nativewind/babel plugin since we're not using it anymore
      '@babel/plugin-transform-export-namespace-from',
      'react-native-reanimated/plugin',
    ]
  };
};
