const { dirname } = require('node:path');

// jest-expo mocks Expo's internal core module. Resolve the copy owned by Expo
// instead of depending on npm hoisting or adding an unsupported direct package.
const expoCoreRoot = dirname(
  require.resolve('expo-modules-core/package.json', {
    paths: [require.resolve('expo/package.json')],
  })
);

module.exports = {
  moduleNameMapper: {
    '^expo-modules-core$': expoCoreRoot,
    '^expo-modules-core/(.*)$': `${expoCoreRoot}/$1`,
  },
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
};
