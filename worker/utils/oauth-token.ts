import type { H3Event } from 'h3'

import { getBlogConfig } from './blog'
import { getCloudflareEnv, getEnv } from './env'

/**
 * The maintainer's own OAuth **user** token, captured when that user signs in to
 * the blog, and preferred over `GITHUB_TOKEN` for every GitHub GraphQL request.
 *
 * Some organisations reject classic personal access tokens outright ("forbids
 * access via a personal access token (classic)"), which is what used to break
 * `/api/about`; an OAuth App user token is accepted there. An anonymous visitor
 * has no session, so the token cannot live in the session cookie: it is stored in
 * an optional KV namespace (`BLOG_OAUTH`) and read by the GraphQL helper. An
 * expired token is refreshed with its refresh token (GitHub rotates both), and
 * anything that goes wrong degrades to `GITHUB_TOKEN` instead of failing the
 * request.
 *
 * The KV binding is optional on purpose: `wrangler.jsonc` only documents it, and
 * a deployment without it keeps working on `GITHUB_TOKEN` alone.
 */

/** Stable key inside the KV namespace. */
export const OAUTH_TOKEN_KEY = 'oauth:user-token'

/**
 * A separate key holding the "this token was rejected" mark. It lives in its own
 * key on purpose: Workers KV has no compare-and-swap, so writing the mark into
 * the token entry itself would be a read-modify-write that a concurrent owner
 * sign-in (or a refresh) could have its fresh pair clobbered by. Here the mark
 * never touches the entry, and its value identifies *which* token was rejected
 * (a SHA-256 fingerprint of the access token), so a stale mark can never match —
 * and therefore never hide — a token stored later.
 */
export const OAUTH_REJECTED_MARK_KEY = 'oauth:user-token:rejected'

/** Refresh this long before the access token actually expires. */
const EXPIRY_MARGIN = 5 * 60 * 1000

export interface StoredOAuthToken {
  accessToken: string
  /** GitHub returns one when the OAuth app expires user tokens */
  refreshToken?: string
  /** epoch milliseconds; absent when GitHub reported no expiry */
  expiresAt?: number
  /** the trusted login this token belongs to, for observability */
  login?: string
  /**
   * The account's numeric GitHub id (`viewer.databaseId`), pinned at the first
   * bootstrap. It is what makes the entry an *identity* record rather than a
   * login string: a changed `GITHUB_OWNER_LOGIN` can never hand the site to
   * whoever now owns that login.
   */
  id?: number
  /** scopes GitHub granted, e.g. `read:org, read:user` */
  scopes?: string
}

/** Only the KV methods used here, so the binding stays optional and structural. */
interface KvNamespace {
  get: (key: string, type?: 'text') => Promise<string | null>
  put: (
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ) => Promise<void>
  /** present on a real KV namespace; guarded so a partial stub still works */
  delete?: (key: string) => Promise<void>
}

/**
 * Whether the "no usable binding" debug line was already emitted. The check runs
 * on every read, but the operator only needs to be told once per isolate.
 */
let warnedAboutBinding = false

/**
 * The KV binding when the deployment really has one; `undefined` otherwise.
 *
 * This validates the *shape*, not the truthiness: a plain variable or secret
 * named `BLOG_OAUTH` is a string, and calling `.get()`/`.put()` on it would throw
 * at runtime. Both methods must be functions, so a mis-set secret is simply
 * ignored (the stored-token path stays disabled and `GITHUB_TOKEN` is used).
 */
const getKv = (event: H3Event): KvNamespace | undefined => {
  const binding = getCloudflareEnv(event).BLOG_OAUTH

  if (
    binding !== null &&
    typeof binding === 'object' &&
    typeof (binding as KvNamespace).get === 'function' &&
    typeof (binding as KvNamespace).put === 'function'
  ) {
    return binding as KvNamespace
  }

  if (!warnedAboutBinding) {
    warnedAboutBinding = true
    // debug level on purpose: this is expected when the optional binding is not
    // configured, and the message carries no secret
    console.debug(
      '[oauth-token] no usable BLOG_OAUTH KV binding; the stored-token path is disabled and GITHUB_TOKEN is used',
    )
  }

  return undefined
}

/**
 * The fresh value is cached per isolate: a Worker isolate serves many requests,
 * and re-reading and re-refreshing the token for every one of them would be
 * wasteful. Only a *usable* token is cached, so an empty or unusable store keeps
 * being re-checked (and can be filled by a later login) instead of being
 * remembered as "no token".
 */
let cachedOAuthToken: StoredOAuthToken | undefined

/**
 * Drops the per-isolate cache, so the next `getUsableOwnerToken` re-reads KV and
 * re-refreshes when needed.
 *
 * Called when the stored token is *rejected* (401/permission error) and whenever
 * a new token is written, so a fresh login or a rotation is picked up at once.
 */
export const invalidateOAuthUserToken = (): void => {
  cachedOAuthToken = undefined
}

/**
 * A stable, non-reversible identifier for an access token: its SHA-256 digest.
 * It identifies the mark's target without ever storing the token itself.
 */
const fingerprint = async (accessToken: string): Promise<string> => {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(accessToken),
  )

  return [...new Uint8Array(bytes)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Records that GitHub rejected a token, so isolates stop retrying it once they
 * observe the mark.
 *
 * The per-isolate cache alone is not enough: a 401 seen by one isolate would
 * leave other isolates (and freshly created ones) reading the same unexpired
 * token from KV and retrying it. KV is eventually consistent (a write can take
 * up to 60 seconds or more to appear elsewhere), so this is a best-effort
 * signal, not an atomic one; correctness does not depend on it, since the
 * isolate that saw the rejection drops its own cache immediately and every use
 * falls through on the rejection.
 *
 * This writes a **separate** key and never touches the token entry, so it cannot
 * clobber a pair that a concurrent sign-in or refresh stored in the meantime.
 * `rejectedAccessToken` is the exact token that failed — the mark records its
 * fingerprint, so it only ever matches that token and a stale mark can never
 * hide a newer one. `persist` is false for broader permission/scope failures,
 * where the token may still be perfectly valid for other queries.
 */
export const markOwnerTokenRejected = async (
  event: H3Event,
  rejectedAccessToken?: string,
  persist = false,
): Promise<void> => {
  invalidateOAuthUserToken()

  const kv = getKv(event)

  if (!persist || !rejectedAccessToken || !kv) {
    return
  }

  try {
    await kv.put(
      OAUTH_REJECTED_MARK_KEY,
      JSON.stringify({
        fingerprint: await fingerprint(rejectedAccessToken),
        rejectedAt: Date.now(),
      }),
    )
  } catch (error) {
    console.warn('[oauth-token] could not mark the token rejected', String(error))
  }
}

/** The rejected-token mark, when one is stored. */
const readRejectedMark = async (
  event: H3Event,
): Promise<{ fingerprint: string } | undefined> => {
  const kv = getKv(event)

  if (!kv) {
    return undefined
  }

  try {
    const raw = await kv.get(OAUTH_REJECTED_MARK_KEY)

    if (!raw) {
      return undefined
    }

    const parsed = JSON.parse(raw) as { fingerprint?: unknown }

    return typeof parsed?.fingerprint === 'string'
      ? { fingerprint: parsed.fingerprint }
      : undefined
  } catch (error) {
    console.warn('[oauth-token] could not read the rejected mark', String(error))
    return undefined
  }
}

/** Whether the stored token is the one the mark says was rejected. */
const isMarkedRejected = async (
  event: H3Event,
  entry: StoredOAuthToken,
): Promise<boolean> => {
  const mark = await readRejectedMark(event)

  return (
    Boolean(mark) && mark?.fingerprint === (await fingerprint(entry.accessToken))
  )
}

export const readStoredOAuthToken = async (
  event: H3Event,
): Promise<StoredOAuthToken | undefined> => {
  const kv = getKv(event)

  if (!kv) {
    return undefined
  }

  try {
    const raw = await kv.get(OAUTH_TOKEN_KEY)

    if (!raw) {
      return undefined
    }

    const parsed = JSON.parse(raw) as StoredOAuthToken

    return parsed && typeof parsed.accessToken === 'string'
      ? parsed
      : undefined
  } catch (error) {
    console.warn('[oauth-token] could not read the stored token', String(error))
    return undefined
  }
}

export const writeStoredOAuthToken = async (
  event: H3Event,
  token: StoredOAuthToken,
): Promise<boolean> => {
  const kv = getKv(event)

  if (!kv) {
    return false
  }

  try {
    await kv.put(OAUTH_TOKEN_KEY, JSON.stringify(token))
    // a newly stored token (a fresh login, or a rotation) must be picked up by
    // the next call instead of the previous isolate cache
    invalidateOAuthUserToken()

    // the mark refers to the token that was replaced, so it is now stale; the
    // fingerprint check would ignore it anyway, this just keeps KV tidy
    if (typeof kv.delete === 'function') {
      await kv
        .delete(OAUTH_REJECTED_MARK_KEY)
        .catch(error =>
          console.warn('[oauth-token] could not clear the rejected mark', String(error)),
        )
    }

    return true
  } catch (error) {
    console.warn('[oauth-token] could not store the token', String(error))
    return false
  }
}

/** A plausible pinned GitHub account id (`viewer.databaseId`). */
const isPinnedOwnerId = (id: unknown): id is number =>
  typeof id === 'number' && Number.isSafeInteger(id) && id > 0

/** Whether the access token is usable now (or close enough not to bother). */
const isFresh = (token: StoredOAuthToken): boolean =>
  Boolean(token.accessToken) &&
  (!token.expiresAt || token.expiresAt - Date.now() > EXPIRY_MARGIN)

/** The trusted login whose sign-in is allowed to populate the store. */
export const getTrustedLogin = (event: H3Event): string => {
  const { github } = useRuntimeConfig(event)

  // `GITHUB_OWNER_LOGIN` is the maintainer's *user* login; it defaults to the
  // app's configured owner (a user by default). When the repository owner is an
  // organisation, set `GITHUB_OWNER_LOGIN` explicitly.
  return getEnv(event, 'GITHUB_OWNER_LOGIN', github.owner)
}

/**
 * Exchanges a refresh token for a fresh access token and stores the rotated
 * pair. Returns `undefined` on any failure so the caller can fall back.
 */
const refreshStoredOAuthToken = async (
  event: H3Event,
  token: StoredOAuthToken,
): Promise<StoredOAuthToken | undefined> => {
  if (!token.refreshToken) {
    return undefined
  }

  const { clientId, clientSecret } = getBlogConfig(event)

  if (!clientId || !clientSecret) {
    console.warn('[oauth-token] cannot refresh: the OAuth app is not configured')
    return undefined
  }

  try {
    const response = await $fetch<{
      access_token?: string
      refresh_token?: string
      expires_in?: number
      scope?: string
      error?: string
      error_description?: string
    }>(
      getEnv(
        event,
        'GITHUB_OAUTH_TOKEN_URL',
        'https://github.com/login/oauth/access_token',
      ),
      {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
        },
        retry: 0,
        timeout: 10_000,
      },
    )

    if (!response.access_token) {
      console.warn(
        '[oauth-token] refresh failed',
        response.error ?? response.error_description ?? 'no access token',
      )
      return undefined
    }

    const next: StoredOAuthToken = {
      accessToken: response.access_token,
      // GitHub rotates refresh tokens, so keep the new one when it is returned
      refreshToken: response.refresh_token ?? token.refreshToken,
      expiresAt: response.expires_in
        ? Date.now() + response.expires_in * 1000
        : undefined,
      login: token.login,
      // the pinned identity must survive a refresh, or the entry stops matching
      id: token.id,
      scopes: response.scope ?? token.scopes,
    }

    if (!(await writeStoredOAuthToken(event, next))) {
      // GitHub rotates refresh tokens, so a pair that was not persisted would
      // leave the store holding a refresh token that may already be invalid;
      // treat that as a refresh failure and let the caller fall back
      console.warn(
        '[oauth-token] refresh succeeded but could not store the new token',
      )
      return undefined
    }

    console.warn('[oauth-token] refreshed the stored OAuth user token')

    return next
  } catch (error) {
    console.warn('[oauth-token] refresh threw', String(error))
    return undefined
  }
}

/**
 * Whether a stored entry is allowed to be used at all. Both the login and the
 * pinned numeric id must be consistent with the current configuration; anything
 * else means "do not use it". The entry is deliberately *not* deleted on a
 * mismatch: deleting is irreversible and would throw away the refresh token for
 * what may just be a typo, while ignoring it has the same effect and is
 * reversible (fix the configuration and the entry works again).
 */
const isUsableEntry = (event: H3Event, entry: StoredOAuthToken): boolean => {
  const expected = getTrustedLogin(event)
  const login = typeof entry.login === 'string' ? entry.login.trim() : ''

  if (!login || login.toLowerCase() !== expected.toLowerCase()) {
    console.warn(
      `[oauth-token] ignoring the stored token (login mismatch): stored=${
        login || 'missing'
      } expected=${expected || 'missing'}`,
    )
    return false
  }

  if (!isPinnedOwnerId(entry.id)) {
    console.warn(
      `[oauth-token] ignoring the stored token (no pinned account id): stored=${login} expected=${expected}`,
    )
    return false
  }

  return true
}

export type CaptureOwnerTokenResult = 'stored' | 'refused' | 'unavailable'

/**
 * Stores the owner's token following the identity-pinning rules:
 *
 * - no entry, or an entry that has no pinned id yet (the first bootstrap, which
 *   also covers an entry created before the id was introduced) -> store, pinning
 *   the signing-in account's id;
 * - same pinned id -> store. A sign-in is a rare, deliberate act, and it is the
 *   only recovery path for a token that died elsewhere (a revocation, or a
 *   rejection another isolate saw), so it must be authoritative on every
 *   isolate rather than being skipped as "healthy" on the strength of
 *   isolate-local knowledge. Overwriting the same identity's entry is always
 *   safe;
 * - different pinned id -> refuse and warn: a changed `GITHUB_OWNER_LOGIN` must
 *   never hand the site to whoever now owns that login.
 *
 * The caller must already have checked `viewer.login === GITHUB_OWNER_LOGIN`.
 */
export const captureOwnerOAuthToken = async (
  event: H3Event,
  token: StoredOAuthToken,
): Promise<CaptureOwnerTokenResult> => {
  const entry = await readStoredOAuthToken(event)

  if (
    entry &&
    isPinnedOwnerId(entry.id) &&
    (!isPinnedOwnerId(token.id) || token.id !== entry.id)
  ) {
    console.warn(
      `[oauth-token] refusing to store the owner token (account id mismatch): stored=${
        entry.login ?? 'missing'
      } signing-in=${token.login ?? 'missing'}`,
    )
    return 'refused'
  }

  return (await writeStoredOAuthToken(event, token))
    ? 'stored'
    : 'unavailable'
}

/**
 * The usable owner entry, or `undefined` to use the fallback. The whole entry is
 * returned (not just the token) because the cache identity is the pinned
 * account id, so it must survive a token rotation.
 */
export const getUsableOwnerToken = async (
  event: H3Event,
): Promise<StoredOAuthToken | undefined> => {
  if (cachedOAuthToken && isFresh(cachedOAuthToken)) {
    return cachedOAuthToken
  }

  const stored = await readStoredOAuthToken(event)

  if (!stored) {
    return undefined
  }

  // read rule: a mismatch means "do not use it", never "delete it"
  if (!isUsableEntry(event, stored)) {
    return undefined
  }

  // a mark only counts when it names *this* token, so a stale mark left by an
  // older token can never hide a freshly stored one
  if (await isMarkedRejected(event, stored)) {
    console.warn(
      `[oauth-token] ignoring the stored token (marked rejected): stored=${stored.login ?? 'missing'}`,
    )
    return undefined
  }

  if (isFresh(stored)) {
    cachedOAuthToken = stored
    return stored
  }

  const refreshed = await refreshStoredOAuthToken(event, stored)

  if (!refreshed) {
    // an expired token without a usable refresh token is useless; the caller
    // falls back to GITHUB_TOKEN rather than sending a dead token
    return undefined
  }

  cachedOAuthToken = refreshed
  return refreshed
}
