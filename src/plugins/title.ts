import Vue from 'vue'

import { ServerContext } from 'types'
import { TITLE } from 'utils'

const setTitle = (vm: Vue) => {
  let { title } = vm.$options
  title = typeof title === 'function' ? title.call(vm, vm) : title
  if (title) {
    const target = __SERVER__ ? (vm.$ssrContext as ServerContext) : document
    target.title = `${TITLE} | ${title}`
  }
}

Vue.mixin(
  __SERVER__
    ? {
        created(this: Vue) {
          setTitle(this)
        },
      }
    : {
        watch: {
          '$t.locale'(this: Vue) {
            setTitle(this)
          },
          '$tt.loading'(this: Vue, loading: boolean) {
            if (!loading) {
              setTitle(this)
              this.$forceUpdate()
            }
          },
        },
        mounted(this: Vue) {
          setTitle(this)
        },
      },
)
