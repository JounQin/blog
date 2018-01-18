interface NodeModule {
  hot?: {
    accept?(): void
  }
}

declare var __DEV__: boolean
declare var __SERVER__: boolean
declare var API_PREFIX: string
declare var SERVER_PREFIX: string

declare module '*.gql' {
  import { DocumentNode } from 'graphql'
  const value: {
    [key: string]: DocumentNode
  }
  export = value
}

declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module 'vue-apollo' {
  const content: any
  const willPrefetch: any
  export default content
  export { willPrefetch }
}
