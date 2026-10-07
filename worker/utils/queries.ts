// Ported from src/queries.gql of the Vue 2 implementation, unchanged on purpose
// so behaviour stays comparable while the migration is in progress.

export const ARTICLES_QUERY = /* GraphQL */ `
  query articles(
    $name: String!
    $owner: String!
    $first: Int
    $last: Int
    $before: String
    $after: String
    $labels: [String!]
  ) {
    repository(name: $name, owner: $owner) {
      issues(
        first: $first
        last: $last
        before: $before
        after: $after
        orderBy: { direction: DESC, field: CREATED_AT }
        states: OPEN
        labels: $labels
      ) {
        nodes {
          createdAt
          id
          number
          title
          labels(first: 5) {
            nodes {
              color
              id
              name
            }
          }
        }
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
      }
    }
  }
`

export const SEARCH_QUERY = /* GraphQL */ `
  query search(
    $first: Int
    $last: Int
    $before: String
    $after: String
    $search: String!
  ) {
    search(
      first: $first
      last: $last
      before: $before
      after: $after
      query: $search
      type: ISSUE
    ) {
      nodes {
        ... on Issue {
          createdAt
          id
          number
          title
          labels(first: 5) {
            nodes {
              color
              id
              name
            }
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`

export const ARTICLE_QUERY = /* GraphQL */ `
  query article($name: String!, $owner: String!, $number: Int!) {
    repository(name: $name, owner: $owner) {
      issue(number: $number) {
        bodyHTML
        createdAt
        title
        url
        labels(first: 5) {
          nodes {
            color
            id
            name
          }
        }
        comments(first: 25) {
          nodes {
            author {
              avatarUrl
              login
              url
            }
            createdAt
            bodyHTML
            url
          }
        }
      }
    }
  }
`

export const CATEGORIES_QUERY = /* GraphQL */ `
  query categories($name: String!, $owner: String!) {
    repository(name: $name, owner: $owner) {
      labels(first: 100) {
        nodes {
          color
          id
          name
        }
      }
    }
  }
`

export const ARCHIVES_QUERY = /* GraphQL */ `
  query archives(
    $name: String!
    $owner: String!
    $after: String
    $labels: [String!]
  ) {
    repository(name: $name, owner: $owner) {
      issues(
        after: $after
        first: 100
        orderBy: { direction: DESC, field: CREATED_AT }
        states: OPEN
        labels: $labels
      ) {
        nodes {
          createdAt
          id
          number
          title
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`

export const PULL_REQUESTS_QUERY = /* GraphQL */ `
  query pullRequests($login: String!, $after: String) {
    user(login: $login) {
      id
      pullRequests(
        after: $after
        first: 100
        states: [MERGED, OPEN]
        orderBy: { direction: DESC, field: CREATED_AT }
      ) {
        nodes {
          ... on PullRequest {
            createdAt
            id
            mergedAt
            state
            title
            url
            repository {
              nameWithOwner
              url
              owner {
                login
              }
            }
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`

export const ISSUES_QUERY = /* GraphQL */ `
  query issues($login: String!, $after: String) {
    user(login: $login) {
      id
      issues(
        after: $after
        first: 100
        orderBy: { direction: DESC, field: CREATED_AT }
      ) {
        nodes {
          ... on Issue {
            closedAt
            createdAt
            id
            state
            title
            url
            repository {
              nameWithOwner
              url
              owner {
                login
              }
            }
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`

/**
 * `ownerType` is either `user` or `organization`; the legacy implementation
 * interpolated it into the query in the same way.
 */
export const getPinnedRepositoriesQuery = (ownerType: string) => {
  const type = ownerType === 'organization' ? 'organization' : 'user'

  return /* GraphQL */ `
    query pinnedRepositories($login: String!) {
      ${type}(login: $login) {
        avatarUrl
        ${type === 'user' ? 'bio company' : 'description'}
        email
        id
        location
        name
        resourcePath
        url
        websiteUrl
        pinnedItems(first: 6) {
          nodes {
            ... on Repository {
              description
              id
              nameWithOwner
              url
              stargazers {
                totalCount
              }
            }
          }
        }
      }
    }
  `
}
