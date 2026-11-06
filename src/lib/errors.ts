/**
 * Narrows an unknown thrown value to a message safe to show a user.
 *
 * Services throw `ApiError` (server said no) or a plain `Error` (request never
 * arrived); both carry a message written for a person. Anything else falls back
 * to the caller's wording rather than leaking a stringified object.
 */
export function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

/** Expected session transitions are handled centrally, without screen errors or alerts. */
export function isSessionEnded(error: unknown): boolean {
  return error instanceof Error && error.name === 'SessionExpiredError';
}
