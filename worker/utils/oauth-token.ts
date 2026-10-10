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
 * Whether the stored token was rejected (401 or a permission error) since it was
 * last read. A same-identity sign-in re-bootstraps the entry only in that case:
 * a healthy entry is left alone, so a routine login does not churn the pair.
 */
let rejectedStoredToken = false

/**
 * Drops the per-isolate cache, so the next `getOAuthUserToken` re-reads KV and
 * re-refreshes when needed.
 *
 * Called when the stored token is *rejected* (401/permission error): keeping a
 * rejected token cached would make every request in this isolate retry it and
 * only then fall back, and a newer token stored in KV would be ignored until the
 * isolate is recycled. Also called when a new token is written, so a fresh login
 * or a rotation is picked up immediately.
 */
export const invalidateOAuthUserToken = (rejected = false): void => {
  cachedOAuthToken = undefined

  if (rejected) {
    rejectedStoredToken = true
  }
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
    rejectedStoredToken = false
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

export type CaptureOwnerTokenResult =
  | 'stored'
  | 'skipped'
  | 'refused'
  | 'unavailable'

/**
 * Stores the owner's token following the identity-pinning rules:
 *
 * - no entry, or an entry that has no pinned id yet (the first bootstrap, which
 *   also covers an entry created before the id was introduced) -> store, pinning
 *   the signing-in account's id;
 * - same pinned id and the stored token was *rejected* -> store (a same-identity
 *   re-bootstrap that repairs the entry);
 * - same pinned id and the token is still healthy -> keep the existing entry, so
 *   a routine login does not churn the refresh-token pair;
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

  if (entry && isPinnedOwnerId(entry.id)) {
    if (!isPinnedOwnerId(token.id) || token.id !== entry.id) {
      console.warn(
        `[oauth-token] refusing to store the owner token (account id mismatch): stored=${
          entry.login ?? 'missing'
        } signing-in=${token.login ?? 'missing'}`,
      )
      return 'refused'
    }

    if (!rejectedStoredToken) {
      console.warn(
        `[oauth-token] keeping the existing owner token: login=${
          token.login ?? 'missing'
        } signed in again while its token is still healthy`,
      )
      return 'skipped'
    }
  }

  return (await writeStoredOAuthToken(event, token))
    ? 'stored'
    : 'unavailable'
}

/** The OAuth user token to prefer, or `undefined` to use the fallback. */
export const getOAuthUserToken = async (
  event: H3Event,
): Promise<string | undefined> => {
  if (cachedOAuthToken && isFresh(cachedOAuthToken)) {
    return cachedOAuthToken.accessToken
  }

  const stored = await readStoredOAuthToken(event)

  if (!stored) {
    return undefined
  }

  // read rule: a mismatch means "do not use it", never "delete it"
  if (!isUsableEntry(event, stored)) {
    return undefined
  }

  if (isFresh(stored)) {
    cachedOAuthToken = stored
    return stored.accessToken
  }

  const refreshed = await refreshStoredOAuthToken(event, stored)

  if (!refreshed) {
    // an expired token without a usable refresh token is useless; the caller
    // falls back to GITHUB_TOKEN rather than sending a dead token
    return undefined
  }

  cachedOAuthToken = refreshed
  return refreshed.accessToken
}
