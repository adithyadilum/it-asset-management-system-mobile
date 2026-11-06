/** Append a page in linear time, retaining existing row identities for memoized lists. */
export function appendUniqueById<T extends { id: string }>(
  previous: T[],
  incoming: T[]
): T[] {
  const seen = new Set(previous.map((item) => item.id));
  const added = incoming.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return added.length ? [...previous, ...added] : previous;
}
