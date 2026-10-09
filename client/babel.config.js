module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo']],

    overrides: [
      {
        // nativewind's import plugin rewrites react-native-web's internal imports to its className
        // wrappers too, which creates an import cycle that crashes web (see metro.config.js).
        // (a function, because Metro loads this config once without a filename)
        exclude: (filename) => !!filename && /node_modules[\\/]react-native-web[\\/]/.test(filename),
        presets: ['nativewind/babel'],
      },
    ],

    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],

          alias: {
            '@/components': './components',
            '@': './src',
            'tailwind.config': './tailwind.config.js',
          },
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
