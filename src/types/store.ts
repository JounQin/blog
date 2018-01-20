import { Organization, User } from './schema'

export type Owner = Organization & User

export interface RootState {
  progress: number
  user: User
}
