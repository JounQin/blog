import type { H3Event } from 'h3'

import { getEnv } from './env'

const COOKIE_NAME = 'blog_sess'
const MAX_AGE = 60 * 60 * 24 * 365

export interface SessionUser {
  avatarUrl: string
  /**
   * The account's numeric GitHub id (`viewer.databaseId`). Used as the cache
   * identity, because it is stable per account while a token is not.
   */
  databaseId?: number
  id: string
  login: string
  name: string | null
  url: string
  websiteUrl: string | null
}

export interface SessionData {
  /** identifies the browser before login, used as the OAuth `state` */
  uuid?: string
  /** GitHub OAuth access token of the logged in user */
  token?: string
  user?: SessionUser
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')

const fromBase64Url = (value: string) =>
  Uint8Array.from(
    atob(value.replaceAll('-', '+').replaceAll('_', '/')),
    char => char.codePointAt(0) as number,
  )

/** `APP_KEYS` is a comma separated list, like the legacy `app.keys` of Koa. */
const getKeys = (event: H3Event): string[] =>
  getEnv(event, 'APP_KEYS')
    .split(',')
    .map(key => key.trim())
    .filter(Boolean)

const sign = async (payload: string, key: string) => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(payload),
  )

  return toBase64Url(new Uint8Array(signature))
}

const isSecureRequest = (event: H3Event) =>
  getRequestURL(event).protocol === 'https:' ||
  getHeader(event, 'x-forwarded-proto') === 'https'

/**
 * Stateless, signed cookie session (replacement for `koa-session`).
 * Returns `{}` when `APP_KEYS` is not configured or the signature is invalid.
 */
export const readSession = async (event: H3Event): Promise<SessionData> => {
  const raw = getCookie(event, COOKIE_NAME)

  if (!raw) {
    return {}
  }

  const separator = raw.lastIndexOf('.')
  const payload = raw.slice(0, separator)
  const signature = raw.slice(separator + 1)

  if (!payload || !signature) {
    return {}
  }

  for (const key of getKeys(event)) {
    if ((await sign(payload, key)) === signature) {
      try {
        return JSON.parse(decoder.decode(fromBase64Url(payload))) as SessionData
      } catch {
        return {}
      }
    }
  }

  return {}
}

export const writeSession = async (
  event: H3Event,
  data: SessionData,
): Promise<SessionData> => {
  const next = { ...(await readSession(event)), ...data }
  const [key] = getKeys(event)

  if (!key) {
    // without APP_KEYS there is nothing to sign with, so the login flow is disabled
    return next
  }

  const payload = toBase64Url(encoder.encode(JSON.stringify(next)))
  const signature = await sign(payload, key)

  setCookie(event, COOKIE_NAME, `${payload}.${signature}`, {
    path: '/',
    maxAge: MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(event),
  })

  return next
}

export const destroySession = (event: H3Event) => {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}
