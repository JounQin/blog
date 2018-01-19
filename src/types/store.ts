import { Issue, Organization, User } from './schema'

export type Owner = User & Organization

export interface RootState {
  archives: Issue[]
  owner: Owner
  progress: number
  user: User
}
