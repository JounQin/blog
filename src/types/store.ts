import { Issue, Label, Organization, PageInfo, User } from './schema'

export type Owner = User & Organization

export interface RootState {
  archives: Issue[]
  issues: Issue[]
  labels: Label[]
  owner: Owner
  pageInfo: PageInfo
  progress: number
  user: User
}
