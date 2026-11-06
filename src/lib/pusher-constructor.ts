import type Pusher from 'pusher-js';

/** Metro's native entry exposes Pusher by name; browser/Node entries use default exports. */
export function resolvePusherConstructor(module: unknown): typeof Pusher {
  const value = module as { default?: unknown; Pusher?: unknown } | null;
  const candidates = [
    module,
    value?.Pusher,
    value?.default,
    (value?.default as { Pusher?: unknown } | undefined)?.Pusher,
    (value?.Pusher as { default?: unknown } | undefined)?.default,
  ];
  const constructor = candidates.find(
    (candidate) => typeof candidate === 'function'
  );
  if (!constructor) throw new Error('Realtime client is unavailable.');
  return constructor as typeof Pusher;
}
