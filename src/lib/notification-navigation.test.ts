import { notificationDestination } from './notification-navigation';
describe('alert destinations', () => {
  const base = 'https://assets.example.com';
  it('opens personal assignments in the app', () =>
    expect(notificationDestination(base, '/my-assets?assignment=2')).toEqual({
      kind: 'native',
      path: '/(dashboard)/my-assets',
    }));
  it('opens other workflows on the trusted deployment without a bearer token', () =>
    expect(
      notificationDestination(base, '/operations/maintenance?ticket=7')
    ).toEqual({ kind: 'web', url: base + '/operations/maintenance?ticket=7' }));
  it.each([
    'https://evil.example.com/assets',
    '//evil.example.com',
    'javascript:alert(1)',
    'https://user:pass@assets.example.com/assets',
    null,
  ])('rejects untrusted target %s', (target) =>
    expect(notificationDestination(base, target)).toBeNull()
  );
});
