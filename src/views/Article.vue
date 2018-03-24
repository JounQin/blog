<template lang="pug">
main(v-if="article")
  h4
    a.heading-link(:href="article.url") {{ $tt(article.title) }}
  small.text-secondary {{ article.createdAt | timeAgo($t.locale) }}
  ul.list-unstyled.d-inline-flex.mb-0
    router-link.d-inline-flex.ml-2.px-2(v-for="{ id, color, name } of article.labels.nodes"
                                        tag="li"
                                        :key="id"
                                        :to="{ path: '/', query: { labels: name } }"
                                        :style="{ backgroundColor: '#' + color }")
      a.small(:style="{ color: $utils.invertColor('#' + color) }") {{ name }}
  small.pull-right.text-primary.clickable(@click="$t.toggleLocale") {{ $t('toggle_locale') }}
  .markdown-body.comment-body.my-3.my-md-5(v-html="$tt(article.bodyHTML, false)")
  ul.list-unstyled
    li.media.my-4(v-for="({ author, createdAt, bodyHTML, url }, index) of article.comments.nodes")
      a.d-none.d-md-block(:href="author.url")
        img.rounded.mr-3.avatar-img(:src="author.avatarUrl + '&s=50'", :srcset="author.avatarUrl + '&s=100 2x'")
      .media-body
        .card
          .card-header.d-flex.align-items-center
            a.d-md-none(:href="author.url")
              img.rounded.mr-3.avatar-img(:src="author.avatarUrl + '&s=32'", :srcset="author.avatarUrl + '&s=64 2x'")
            .d-inline-block
              a.text-dark(:href="author.url") {{ author.login }}
              a.small.text-secondary.d-block.d-md-inline-block.ml-0.ml-md-2(:href="url") {{ createdAt | timeAgo($t.locale) }}
          .card-body.markdown-body.comment-body(v-html="bodyHTML")
  .d-flex.justify-content-center
    a(:href="article.url + '#new_comment_field'") {{ $t('add_comment') }}
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Store } from 'vuex'

import { Issue, RootState } from 'types'

import querires from 'queries.gql'

const getQueryOptions = (
  store: Store<RootState>,
  issueNumber: number | string,
) => ({
  query: querires.article,
  variables: {
    ...store.getters.REPOSITORY,
    number: +issueNumber,
  },
})

@Component({
  async asyncData({ apollo, route, store, translate }) {
    const { data: { repository: { issue: article } } } = await apollo.query<{
      repository: {
        issue: Issue
      }
    }>(getQueryOptions(store, route.params.number))
    translate(article.title)
    translate(article.bodyHTML, false)
  },
  title: (vm: Article) => vm.$tt(vm.article.title),
  translator: {
    en: {
      add_comment: 'Add Comment',
    },
    zh: {
      add_comment: '添加评论',
    },
  },
})
export default class Article extends Vue {
  get article(): Issue {
    return this.$apollo.readQuery<{
      repository: {
        issue: Issue
      }
    }>(getQueryOptions(this.$store, this.$route.params.number)).repository.issue
  }
}
</script>
