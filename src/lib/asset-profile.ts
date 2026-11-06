export function formatProfileDate(value: string | null | undefined): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not recorded'
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Colombo',
      });
}
export function formatSpecification(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value))
    return value.map(formatSpecification).filter(Boolean).join(', ');
  if (typeof value === 'object')
    return Object.entries(value)
      .map(
        ([key, item]) =>
          `${formatSpecificationLabel(key)}: ${formatSpecification(item)}`
      )
      .join('; ');
  return String(value);
}
export function formatSpecificationLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
