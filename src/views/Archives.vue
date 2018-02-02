<template lang="pug">
main
  .my-2.my-md-5(:class="$style.main")
    h6(:class="[$style.item, $style.title]") {{ $t('total_archives_count', [archives.length]) }}
    ol.list-unstyled
      li(v-for="{ archives, year } of archivesMap")
        h5.mt-5.my-3(:class="$style.item") {{ year }}
        ol.list-unstyled
          li.py-4(v-for="{ createdAt, id, number, title } of archives"
             :class="[$style.item, $style.article]"
             :key="id")
            small.text-muted.mr-2 {{ createdAt | dateFormat('MM-DD') }}
            router-link(:to="`/article/${number}`") {{ $tt(title) }}
</template>
<script lang="ts">
import { uniqBy } from 'lodash'
import { Component, Vue } from 'vue-property-decorator'

import { Apollo, Issue, Repository } from 'types'
import { REPOSITORY, getDefaultLabels } from 'utils'

import * as queries from 'queries.gql'

const fetchArchieves = async (
  apollo: Apollo,
  after?: string,
): Promise<Issue[]> => {
  const { data: { repository: { issues } } } = await apollo.query<{
    repository: Repository
  }>({
    query: queries.archives,
    variables: {
      ...REPOSITORY,
      after,
      labels: getDefaultLabels(apollo).map(({ name }) => name),
    },
  })

  const { nodes, pageInfo } = issues

  const nextIssues = pageInfo.hasNextPage
    ? await fetchArchieves(apollo, pageInfo.endCursor)
    : []

  return [...nodes, ...nextIssues]
}

interface ArchivesMap {
  [year: number]: Issue[]
}

type ArchivesList = Array<{
  year: number
  archives: Issue[]
}>

@Component({
  asyncData: async ({ apollo, translate }) => {
    const archives = uniqBy(await fetchArchieves(apollo), 'id')
    archives.forEach(({ title }) => translate(title))
    apollo.writeQuery({
      query: queries.allArchives,
      data: {
        issues: archives,
      },
    })
  },
  title: (vm: Archives) => vm.$t('archives'),
  translator: {
    en: {
      archives: 'Archives',
      total_archives_count: 'There are { 0 } articles now, keep it up.',
    },
    zh: {
      archives: '归档',
      total_archives_count: '目前共计 { 0 } 篇日志，继续努力。',
    },
  },
})
export default class Archives extends Vue {
  get archives(): Issue[] {
    return this.$apollo.readQuery<{
      issues: Issue[]
    }>({
      query: queries.allArchives,
    }).issues
  }

  get archivesMap(): ArchivesList {
    const archivesMap: ArchivesMap = {}

    this.archives.forEach(archive => {
      const year = new Date(archive.createdAt).getFullYear()

      if (!archivesMap[year]) {
        archivesMap[year] = []
      }

      archivesMap[year].push(archive)
    })

    return Object.keys(archivesMap)
      .reverse()
      .reduce(
        (archivesList, year: number | string) => {
          year = +year
          archivesList.push({
            year,
            archives: archivesMap[year],
          })
          return archivesList
        },
        [] as ArchivesList,
      )
  }
}
</script>
<style lang="scss" module>
.main {
  position: relative;
  margin-left: 15px;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -4px;
    width: 4px;
    background-color: #f5f5f5;
  }
}

.item {
  position: relative;
  padding-left: 20px;

  &:before {
    position: absolute;
    content: '';
    width: 8px;
    height: 8px;
    background-color: #bbb;
    border-radius: 50%;
    top: 50%;
    left: -2px;
    transform: translate3d(-50%, -50%, 0);
  }

  &.title:before {
    width: 10px;
    height: 10px;
    background-color: #555;
    opacity: 0.5;
  }

  &.article {
    border-bottom: 1px dashed #ccc;

    &:hover {
      border-bottom-color: #666;

      &:before {
        background-color: #222;
      }
    }
  }
}
</style>
