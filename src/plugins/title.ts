import Vue from 'vue'

import { TITLE } from 'utils'

const setTitle = (vm: Vue) => {
  let { title } = vm.$options
  title = typeof title === 'function' ? title.call(vm, vm) : title
  if (title) {
    const target = __SERVER__ ? vm.$ssrContext : document
    target.title = `${TITLE} | ${title}`
  }
}

Vue.mixin(
  __SERVER__
    ? {
        created() {
          setTitle(this)
        },
      }
    : {
        watch: {
          '$t.locale'() {
            setTitle(this)
          },
          '$tt.loading'(loading) {
            if (!loading) {
              setTitle(this)
              this.$forceUpdate()
            }
          },
        },
        mounted() {
          setTitle(this)
        },
      },
)
