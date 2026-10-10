/**
 * One SHA-256 hex helper, shared by the cache-key computation (`github.ts`) and
 * the rejected-token fingerprint (`oauth-token.ts`), so the two can never drift.
 */
export const sha256Hex = async (value: string): Promise<string> => {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )

  return [...new Uint8Array(bytes)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}
