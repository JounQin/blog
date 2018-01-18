<template lang="pug">
main
  h4.my-5.text-center {{ $t('total_categories_count', [labels.length]) }}
  ul.list-unstyled
    router-link.d-inline-flex.mx-2.my-2(v-for="{color, id, name} of labels"
                                        tag="li"
                                        :key="id"
                                        :to="{ path: '/', query: { labels: name } }"
                                        :style="{ backgroundColor: '#' + color }")
      a.px-3.py-1.small(:style="{ color: $utils.invertColor(color) }") {{ name }}
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { State } from 'vuex-class'

import { Label } from 'types'

@Component({
  translator: {
    en: {
      total_categories_count: 'There are { 0 } categories totally now',
    },
    zh: {
      total_categories_count: '目前共计 { 0 } 个分类',
    },
  },
})
export default class Categories extends Vue {
  @State('labels') labels: Label[]
}
</script>
