<template lang="pug">
main(v-if="issue")
  h4
    a.heading-link(:href="issue.url") {{ issue.title }}
  small.text-secondary {{ issue.createdAt | timeAgo }}
  ul.list-unstyled.d-inline-flex.mb-0
    router-link.d-inline-flex.ml-2.px-2(v-for="{ id, color, name } of issue.labels.nodes"
                          tag="li"
                          :key="id"
                          :to="{ path: '/', query: { labels: name } }"
                          :style="{ backgroundColor: '#' + color }")
      a.small(:style="{ color: invertColor('#' + color) }") {{ name }}
  .markdown-body.comment-body.my-3.my-md-5(v-html="issue.bodyHTML")
  ul.list-unstyled
    li.media.my-4(v-for="({ author, createdAt, bodyHTML, url }, index) of issue.comments.nodes")
      a.d-none.d-md-block(:href="author.url")
        img.rounded.mr-3.avatar-img(:src="author.avatarUrl")
      .media-body
        .card
          .card-header.d-flex.align-items-center
            a.d-md-none(:href="author.url")
              img.rounded.mr-3.avatar-img(:src="author.avatarUrl")
            .d-inline-block
              a.text-dark(:href="author.url") {{ author.login }}
              a.small.text-secondary.d-block.d-md-inline-block.ml-0.ml-md-2(:href="url") {{ createdAt | timeAgo }}
          .card-body.markdown-body.comment-body(v-html="bodyHTML")
  .d-flex.justify-content-center
    a(:href="issue.url + '#new_comment_field'") 添加评论
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { State } from 'vuex-class'

import { Issue } from 'types'
import { REPOSITORY, invertColor } from 'utils'

import * as querires from 'queries.gql'

@Component({
  async asyncData({ route, store }) {
    const { data } = await Vue.apollo.query<{
      repository: { issue: Issue }
    }>({
      query: querires.issue,
      variables: {
        ...REPOSITORY,
        number: +route.params.number,
      },
    })
    store.commit('SET_ISSUE', data.repository.issue)
  },
})
export default class Article extends Vue {
  @State('issue') issue: Issue

  invertColor = invertColor
}
</script>