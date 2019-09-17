declare let __DEV__: boolean
declare let __SERVER__: boolean
declare let SERVER_PREFIX: string

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
