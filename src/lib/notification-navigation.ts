export type NotificationDestination =
  | { kind: 'native'; path: '/(dashboard)/my-assets' }
  | { kind: 'web'; url: string };
/** Alert links can only open this deployment. Bearer tokens never enter URLs. */
export function notificationDestination(
  baseUrl: string,
  target: string | null
): NotificationDestination | null {
  if (!target || target.includes('\\')) return null;
  try {
    const origin = new URL(baseUrl).origin;
    const url = new URL(target, origin);
    if (
      url.origin !== origin ||
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    if (url.pathname === '/my-assets')
      return { kind: 'native', path: '/(dashboard)/my-assets' };
    return { kind: 'web', url: url.href };
  } catch {
    return null;
  }
}
