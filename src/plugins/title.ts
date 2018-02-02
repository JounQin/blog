import Vue from 'vue'

import { TITLE } from 'utils'

function getTitle(vm: Vue) {
  const { title } = vm.$options
  if (title) {
    return typeof title === 'function' ? title.call(vm, vm) : title
  }
}

Vue.mixin(
  __SERVER__
    ? {
        created() {
          const title = getTitle(this)
          if (title) {
            this.$ssrContext.title = `${TITLE} | ${title}`
          }
        },
      }
    : {
        watch: {
          '$t.locale'() {
            this._changeTitle()
          },
          '$tt.loading'(loading) {
            if (!loading) {
              this._changeTitle()
              this.$forceUpdate()
            }
          },
        },
        mounted() {
          this._changeTitle()
        },
        methods: {
          _changeTitle() {
            const title = getTitle(this)
            if (title) {
              document.title = `${TITLE} | ${title}`
            }
          },
        },
      },
)
