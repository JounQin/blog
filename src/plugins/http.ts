import axios from 'axios'
import Vue from 'vue'

axios.defaults.baseURL = SERVER_PREFIX + 'api'

Object.defineProperty(
  Vue.prototype,
  '$http',
  __SERVER__
    ? {
        configurable: __DEV__,
        get() {
          return this.$ssrContext.axios
        },
      }
    : { value: axios, writable: __DEV__ },
)
