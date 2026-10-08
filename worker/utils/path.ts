/**
 * Only same-origin redirect targets are allowed.
 *
 * A plain `startsWith('/')` check is not enough: browsers resolve `//host/path`
 * (and `/\host/path`) as protocol-relative URLs, so they would leave the site.
 * That matters for the `path` parameter of `/api/login` and `/api/oauth`.
 */
export const safeInternalPath = (raw: unknown): string => {
  if (typeof raw !== 'string' || !raw.startsWith('/')) {
    return '/'
  }
  if (raw.startsWith('//') || raw.startsWith('/\\')) {
    return '/'
  }
  return raw
}
