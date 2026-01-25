module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    overrides: [
      {
        // Exclude widget files from NativeWind processing
        // Widgets MUST use pure React Native components only
        test: (filename) => {
          if (!filename) return false;
          const normalized = filename.replace(/\\/g, '/');
          const basename = normalized.split('/').pop() || '';
          // Match files in widgets directory or known widget file names
          return (
            /[\\/]widgets[\\/]/.test(normalized) ||
            normalized.includes('widgets/') ||
            basename === 'PrayerTimesWidget.tsx' ||
            basename === 'widget-task-handler.tsx'
          );
        },
        presets: [
          // For widget files, use pure React Native without NativeWind
          ['babel-preset-expo', { jsxImportSource: 'react' }],
          // Explicitly do NOT include 'nativewind/babel' here
        ],
      },
    ],
  };
};

