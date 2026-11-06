import { formatProfileDate, formatSpecification } from './asset-profile';
it('formats boolean and nested specifications without losing false or zero', () => {
  expect(formatSpecification(false)).toBe('No');
  expect(formatSpecification(0)).toBe('0');
  expect(formatSpecification({ memory: ['16 GB', 'DDR5'] })).toBe(
    'Memory: 16 GB, DDR5'
  );
});
it('does not invent dates for missing or invalid values and uses Colombo dates', () => {
  expect(formatProfileDate(null)).toBe('Not recorded');
  expect(formatProfileDate('invalid')).toBe('Not recorded');
  expect(formatProfileDate('2026-11-01T20:00:00Z')).toBe('2 Nov 2026');
});
