// Types shared between the Nuxt app (app/) and the nitro/Cloudflare routes (worker/).

export interface BlogLabel {
  id: string
  name: string
  color: string
}

export interface BlogIssue {
  createdAt: string
  id: string
  number: number
  title: string
  labels: {
    nodes: BlogLabel[]
  }
}

export interface BlogPageInfo {
  endCursor: string | null
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor: string | null
}

export interface IssuesPayload {
  nodes: BlogIssue[]
  pageInfo: BlogPageInfo
}

export interface LabelsPayload {
  nodes: BlogLabel[]
}

export interface BlogComment {
  author: {
    avatarUrl: string
    login: string
    url: string
  } | null
  createdAt: string
  bodyHTML: string
  url: string
}

export interface ArticlePayload {
  bodyHTML: string
  createdAt: string
  title: string
  url: string
  labels: {
    nodes: BlogLabel[]
  }
  comments: {
    nodes: BlogComment[]
  }
}

interface RepositoryRef {
  nameWithOwner: string
  url: string
  owner: {
    login: string
  }
}

export interface PullRequestItem {
  createdAt: string
  id: string
  mergedAt: string | null
  state: string
  title: string
  url: string
  repository: RepositoryRef
  /** added by /api/pulse so the view can tell PRs and issues apart */
  isPr?: boolean
}

export interface PulseIssue {
  closedAt: string | null
  createdAt: string
  id: string
  state: string
  title: string
  url: string
  repository: RepositoryRef
}

export interface PulsePayload<T> {
  nodes: T[]
  pageInfo: {
    endCursor: string | null
    hasNextPage: boolean
  }
}

export interface PinnedRepository {
  description: string | null
  id: string
  nameWithOwner: string
  url: string
  stargazers: {
    totalCount: number
  }
}

export interface OwnerProfile {
  avatarUrl: string
  bio?: string | null
  company?: string | null
  description?: string | null
  email: string | null
  id: string
  location: string | null
  name: string | null
  resourcePath: string
  url: string
  websiteUrl: string | null
  pinnedItems: {
    nodes: PinnedRepository[]
  }
}
