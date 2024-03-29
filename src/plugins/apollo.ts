import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import Vue from 'vue'

import { SERVER_PREFIX } from './constants'

import { ServerContext } from 'types'

export const createApollo = () =>
  new ApolloClient({
    link: createHttpLink({
      uri: SERVER_PREFIX + 'graphql',
    }),
    cache: new InMemoryCache(),
    ssrMode: __SERVER__,
  })

export const apollo = __SERVER__ ? null : createApollo()

Object.defineProperty(
  Vue.prototype,
  '$apollo',
  __SERVER__
    ? {
        configurable: __DEV__,
        get(this: Vue) {
          return (this.$ssrContext as ServerContext).apollo
        },
      }
    : {
        value: apollo,
        writable: __DEV__,
      },
)
