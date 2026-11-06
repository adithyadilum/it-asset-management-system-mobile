import { appendUniqueById } from './list-pages';

it('keeps existing rows and deduplicates both page boundaries and incoming duplicates', () => {
  const first = { id: 'LAP-101' },
    second = { id: 'LAP-102' },
    next = { id: 'LAP-103' };
  const previous = [first, second];
  const result = appendUniqueById(previous, [
    { id: second.id },
    next,
    { id: next.id },
  ]);
  expect(result).toEqual([first, second, next]);
  expect(result[0]).toBe(first);
  expect(result[1]).toBe(second);
  expect(previous).toEqual([first, second]);
  expect(appendUniqueById(previous, [{ id: first.id }])).toBe(previous);
});
it('does bounded work when appending a page to a large inventory', () => {
  let idReads = 0;
  const row = (id: number) => ({
    get id() {
      idReads++;
      return String(id);
    },
  });
  const previous = Array.from({ length: 1000 }, (_, i) => row(i));
  const incoming = Array.from({ length: 20 }, (_, i) => row(1000 + i));
  const result = appendUniqueById(previous, incoming);
  expect(result).toHaveLength(1020);
  expect(idReads).toBeLessThan(previous.length + incoming.length * 3);
});
