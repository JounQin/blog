import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import Vue from 'vue'

export const createApollo = () => {
  const cache = new InMemoryCache()

  if (!__SERVER__ && window.__APOLLO_STATE__) {
    cache.restore(window.__APOLLO_STATE__)
  }

  const apollo = new ApolloClient({
    link: createHttpLink({
      uri: SERVER_PREFIX + 'graphql',
    }),
    cache,
    ssrMode: __SERVER__,
  })

  if (!__SERVER__) {
    Object.defineProperty(Vue.prototype, '$apollo', {
      value: apollo,
      writable: __DEV__,
    })
  }

  return apollo
}

if (__SERVER__) {
  Object.defineProperty(Vue.prototype, '$apollo', {
    configurable: __DEV__,
    get() {
      return this.$ssrContext.apollo
    },
  })
}
