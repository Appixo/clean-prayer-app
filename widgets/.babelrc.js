// Babel config for widget files only
// This overrides the parent babel.config.js to exclude NativeWind
module.exports = {
  presets: [
    ['babel-preset-expo', { jsxImportSource: 'react' }],
    // Explicitly do NOT include 'nativewind/babel'
  ],
};
