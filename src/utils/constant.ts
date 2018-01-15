export const GITHUB_REPOSITORY_NAME = process.env.GITHUB_REPOSITORY_NAME
export const GITHUB_REPOSITORY_OWNER = process.env.GITHUB_REPOSITORY_OWNER

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