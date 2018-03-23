export const GITHUB_REPOSITORY_NAME = process.env.GITHUB_REPOSITORY_NAME
export const GITHUB_REPOSITORY_OWNER = process.env.GITHUB_REPOSITORY_OWNER

export const GITHUB_EXCLUDED_LABELS = (
  process.env.GITHUB_EXCLUDED_LABELS || ''
).split(',')
export const GITHUB_EXCLUDED_REPOSITORY_OWNERS = (
  process.env.GITHUB_EXCLUDED_REPOSITORY_OWNERS || ''
).split(',')

export enum OwnerType {
  user = 'user',
  organization = 'organization',
}

export const OWNER_TYPE = process.env.GITHUB_REPOSITORY_OWNER_TYPE as OwnerType

export const IS_USER = OWNER_TYPE === OwnerType.user

export const REPOSITORY = {
  name: GITHUB_REPOSITORY_NAME,
  owner: GITHUB_REPOSITORY_OWNER,
}

export const LOGIN = {
  login: GITHUB_REPOSITORY_OWNER,
}

export const INFINITY_DATE = 'Fri, 31 Dec 9999 23:59:59 GMT'

export const LOCALE_COOKIE = 'LOCALE_COOKIE'

export const TITLE = '1stG Blog'

export enum Locale {
  EN = 'en',
  ZH = 'zh',
}

const { EN, ZH } = Locale

export const TOGGLE_LOCALE = {
  [EN]: ZH,
  [ZH]: EN,
}

export const DEFAULT_LOCALE = Locale.EN

export const LOCALES = [Locale.EN, Locale.ZH]
