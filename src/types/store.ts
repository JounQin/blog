import { Organization, User } from './schema'

export type Owner = User & Organization

export interface RootState {
  owner: Owner
  progress: number
  user: User
}
