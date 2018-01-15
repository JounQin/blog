import Vue from 'vue'

import { dateFormat, timeAgo } from 'utils'

Vue.filter('dateFormat', dateFormat)
Vue.filter('timeAgo', timeAgo)
