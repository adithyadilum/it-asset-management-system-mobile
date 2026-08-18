/* eslint-disable no-console */

/**
 * The app's single logging surface.
 *
 * React Native keeps `console` output in release builds, so logging is funnelled
 * through here rather than called directly. That gives one place to redact,
 * silence, or forward to a crash reporter later, and one rule about what may be
 * logged: never a token, a payload, or a user identifier.
 *
 * `debug` is dropped outside development. Warnings and errors are always kept —
 * losing them in production would cost more than the noise saves.
 */
export const logger = {
  debug(message: string, ...details: unknown[]): void {
    if (__DEV__) {
      console.log(message, ...details);
    }
  },

  warn(message: string, ...details: unknown[]): void {
    console.warn(message, ...details);
  },

  error(message: string, error?: unknown): void {
    console.error(message, error);
  },
};
