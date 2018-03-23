<template lang="pug">
main
  .row
    .col-md
      ol.list-unstyled(:class="$style.list")
        li.d-flex.align-items-center.my-4(v-for="{ createdAt, mergedAt, repository, state, title, url } of pullRequests")
          .px-3
            i.fa.fa-code-fork(:class="state.toLowerCase()")
          div
            h5.font-weight-bold
              a.heading-link(:href="url") {{ title }}
              small.text-muted.ml-2 {{ $t('created_at') }}: {{ createdAt | dateFormat }}
              small.text-muted.ml-2(v-if="mergedAt") {{ $t('merged_at') }}: {{ mergedAt | dateFormat }}
            a(:href="repository.url") {{ repository.owner.login }}/{{ repository.name }}
      .text-center.text-muted.clickable(v-if="pageInfo.hasNextPage"
                                        @click="fetchMore") {{ $t('load_more') }}
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

import { PageInfo, PullRequest, User } from 'types'
import { GITHUB_EXCLUDED_REPOSITORY_OWNERS, LOGIN } from 'utils'

import queries from 'queries.gql'

@Component({
  asyncData: ({ apollo }) =>
    apollo.query({
      query: queries.pullRequests,
      variables: LOGIN,
    }),
  title: (vm: Pulse) => vm.$t('pulse'),
  translator: {
    zh: {
      created_at: '创建于',
      merged_at: '合并于',
      load_more: '加载更多',
    },
    en: {
      created_at: 'Created At',
      merged_at: 'Merged At',
      load_more: 'Load More',
    },
  },
})
export default class Pulse extends Vue {
  pullRequests: PullRequest[] = null
  pageInfo: PageInfo = null

  created() {
    this.setData()
  }

  setData(after?: string) {
    const { pullRequests: prs } = this.$apollo.readQuery<{ user: User }>({
      query: queries.pullRequests,
      variables: {
        ...LOGIN,
        after,
      },
    }).user

    const pullRequests = prs.nodes.filter(
      ({ repository }) =>
        !GITHUB_EXCLUDED_REPOSITORY_OWNERS.includes(repository.owner.login),
    )

    if (this.pullRequests) {
      this.pullRequests.push(...pullRequests)
    } else {
      this.pullRequests = pullRequests
    }

    this.pageInfo = prs.pageInfo
  }

  async fetchMore() {
    const after = this.pageInfo.endCursor

    await this.$apollo.query({
      query: queries.pullRequests,
      variables: {
        ...LOGIN,
        after,
      },
    })

    this.setData(after)
  }
}
</script>
<style lang="scss" module>
.list > li :global {
  h5 small {
    font-size: 12px;
  }

  .fa {
    font-size: 20px;

    &.open {
      color: #28a745;
    }

    &.merged {
      color: #6f42c1;
    }
  }
}
</style>
