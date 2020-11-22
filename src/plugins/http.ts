import axios from 'axios'
import Vue from 'vue'

import { SERVER_PREFIX } from './constants'

axios.defaults.baseURL = SERVER_PREFIX + 'api'

Object.defineProperty(
  Vue.prototype,
  '$http',
  __SERVER__
    ? {
        configurable: __DEV__,
        get(this: Vue) {
          return this.$ssrContext.axios
        },
      }
    : { value: axios, writable: __DEV__ },
)
