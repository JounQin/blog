declare var __DEV__: boolean
declare var __SERVER__: boolean
declare var DEFAULT_PORT: number

declare module '*.gql' {
  import { DocumentNode } from 'graphql'

  const value: {
    [key: string]: DocumentNode
  }

  export = value
}

declare module '*.vue' {
  export { default } from 'vue'
}
