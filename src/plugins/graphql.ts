import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import Vue from 'vue'
import VueApollo from 'vue-apollo'

Vue.use(VueApollo)

const cache = new InMemoryCache()

if (!__SERVER__ && window.__APOLLO_STATE__) {
  cache.restore(window.__APOLLO_STATE__.defaultClient)
}

export const apolloClient = new ApolloClient({
  link: createHttpLink({
    uri: SERVER_PREFIX + 'graphql',
  }),
  cache,
  ssrMode: __SERVER__,
})

Object.defineProperty(Vue, 'apollo', {
  value: apolloClient,
  writable: __DEV__,
})
