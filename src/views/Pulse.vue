<template lang="pug">
main
  .row
    .col-md
      ol.list-unstyled(:class="$style.list")
        li.d-flex.align-items-center.my-4(v-for="{ createdAt, isPr, mergedAt, repository, state, title, url } of pulses")
          .px-3
            i.fa(:class="[isPr ? 'fa-code-fork' : 'fa-bug', state.toLowerCase()]")
          div
            h5.font-weight-bold
              a.heading-link(:href="url") {{ title }}
              small.text-muted.ml-2 {{ $t('created_at') }}: {{ createdAt | dateFormat }}
              small.text-muted.ml-2(v-if="mergedAt") {{ $t('merged_at') }}: {{ mergedAt | dateFormat }}
            a(:href="repository.url") {{ repository.nameWithOwner }}
      .text-center.text-muted.clickable(v-if="prPageInfo.hasNextPage || iPageInfo.hasNextPage"
                                        @click="fetchMore") {{ $t('load_more') }}
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Store } from 'vuex'

import { Issue, PageInfo, PullRequest, RootState, User } from 'types'

import queries from 'queries.gql'

@Component({
  asyncData: ({ apollo, store: { getters: { LOGIN } } }) =>
    Promise.all([
      apollo.query({
        query: queries.pullRequests,
        variables: LOGIN,
      }),
      apollo.query({
        query: queries.issues,
        variables: LOGIN,
      }),
    ]),
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
  prPageInfo: PageInfo = null

  issues: Issue[] = null
  iPageInfo: PageInfo = null

  get pulses() {
    return [...this.pullRequests, ...this.issues].sort(
      (x, y) => (x.createdAt > y.createdAt ? -1 : 1),
    )
  }

  created() {
    this.setData(this.$store)
  }

  setData(
    store: Store<RootState>,
    {
      prAfter,
      prNext,
      iAfter,
      iNext,
    }: {
      prAfter?: string
      prNext?: boolean
      iAfter?: string
      iNext?: boolean
    } = {},
  ) {
    const { LOGIN } = store.getters
    const excludedOwners = store.state.envs.GITHUB_EXCLUDED_REPOSITORY_OWNERS

    if (prNext !== false) {
      const { pullRequests: prs } = this.$apollo.readQuery<{ user: User }>({
        query: queries.pullRequests,
        variables: {
          ...LOGIN,
          after: prAfter,
        },
      }).user

      const pullRequests = prs.nodes.filter(pr => {
        Object.assign(pr, { isPr: true })
        return !excludedOwners.includes(pr.repository.owner.login)
      })

      if (this.pullRequests) {
        this.pullRequests.push(...pullRequests)
      } else {
        this.pullRequests = pullRequests
      }

      this.prPageInfo = prs.pageInfo
    }

    if (iNext !== false) {
      const { issues: is } = this.$apollo.readQuery<{ user: User }>({
        query: queries.issues,
        variables: {
          ...LOGIN,
          after: iAfter,
        },
      }).user

      const issues = is.nodes.filter(
        issue => !excludedOwners.includes(issue.repository.owner.login),
      )

      if (this.issues) {
        this.issues.push(...issues)
      } else {
        this.issues = issues
      }

      this.iPageInfo = is.pageInfo
    }
  }

  async fetchMore() {
    const { endCursor: prAfter, hasNextPage: prNext } = this.prPageInfo
    const { endCursor: iAfter, hasNextPage: iNext } = this.iPageInfo

    const promises: Array<Promise<any>> = []

    if (prNext) {
      promises.push(
        this.$apollo.query({
          query: queries.pullRequests,
          variables: {
            ...this.$store.getters.LOGIN,
            after: prAfter,
          },
        }),
      )
    }

    if (iNext) {
      promises.push(
        this.$apollo.query({
          query: queries.issues,
          variables: {
            ...this.$store.getters.LOGIN,
            after: iAfter,
          },
        }),
      )
    }

    await Promise.all(promises)

    this.setData(this.$store, {
      prAfter,
      prNext,
      iAfter,
      iNext,
    })
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

    &.closed {
      color: #cb2431;
    }
  }
}
</style>
