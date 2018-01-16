import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import Vue from 'vue'

const apollo = new ApolloClient({
  link: createHttpLink({
    uri: SERVER_PREFIX + 'graphql',
  }),
  cache: new InMemoryCache(),
})

Object.defineProperty(Vue, 'apollo', {
  value: apollo,
  writable: __DEV__,
})

Object.defineProperty(Vue.prototype, '$apollo', {
  value: apollo,
  writable: __DEV__,
})
