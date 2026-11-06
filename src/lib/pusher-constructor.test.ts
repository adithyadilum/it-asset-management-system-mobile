import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { resolvePusherConstructor } from './pusher-constructor';
it('supports default, named and CommonJS wrappers', () => {
  const constructor = function Pusher() {};
  for (const module of [
    constructor,
    { default: constructor },
    { Pusher: constructor },
    { default: { Pusher: constructor } },
    { Pusher: { default: constructor } },
  ]) {
    expect(resolvePusherConstructor(module)).toBe(constructor);
  }
  expect(() => resolvePusherConstructor({})).toThrow('unavailable');
});
it('loads the constructor from the actual installed React Native bundle', async () => {
  const source = readFileSync(
    join(
      dirname(require.resolve('pusher-js/package.json')),
      'dist/react-native/pusher.js'
    ),
    'utf8'
  );
  const module = { exports: {} };
  const net = {
    addEventListener: () => () => {},
    fetch: async () => ({ type: 'wifi', isConnected: true }),
  };
  runInNewContext(source, {
    module,
    exports: module.exports,
    require: (name: string) => {
      if (name === '@react-native-community/netinfo')
        return { ...net, default: net };
      throw new Error('Unexpected native dependency');
    },
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  });
  await Promise.resolve();
  expect(typeof resolvePusherConstructor(module.exports)).toBe('function');
});
