import axios from 'axios'
import Vue from 'vue'

axios.defaults.baseURL = SERVER_PREFIX + API_PREFIX.replace(/^\/+/, '')

Object.defineProperty(Vue, 'http', {
  value: axios,
  writable: __DEV__,
})

Object.defineProperty(Vue.prototype, '$http', {
  value: axios,
  writable: __DEV__,
})
