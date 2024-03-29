import axios from 'axios'
import Vue from 'vue'

import { SERVER_PREFIX } from './constants'

import { ServerContext } from 'types'

axios.defaults.baseURL = SERVER_PREFIX + 'api'

Object.defineProperty(
  Vue.prototype,
  '$http',
  __SERVER__
    ? {
        configurable: __DEV__,
        get(this: Vue) {
          return (this.$ssrContext as ServerContext).axios
        },
      }
    : { value: axios, writable: __DEV__ },
)
