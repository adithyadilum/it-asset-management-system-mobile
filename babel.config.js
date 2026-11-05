module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    // SDK 57 configures the Worklets transform through babel-preset-expo.
  };
};
