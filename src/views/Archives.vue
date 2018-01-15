<template lang="pug">
main
  .my-2.my-md-5(:class="$style.main")
    h6(:class="[$style.item, $style.title]") 目前共计 {{ archives.length }} 篇日志。继续努力。
    ol.list-unstyled
      li(v-for="{ archives, year } of archivesMap")
        h5.mt-5.my-3(:class="$style.item") {{ year }}
        ol.list-unstyled
          li.py-4(v-for="{ createdAt, id, number, title } of archives"
             :class="[$style.item, $style.article]"
             :key="id")
            small.text-muted.mr-2 {{ createdAt | dateFormat('MM-DD') }}
            router-link(:to="`/article/${number}`") {{ title }}
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Store } from 'vuex'
import { State } from 'vuex-class'

import { Issue, Repository, RootState } from 'types'
import { REPOSITORY } from 'utils'

import * as queries from 'queries.gql'

const fetchArchieves = async (
  store: Store<RootState>,
  after?: string,
): Promise<undefined> => {
  const { data: { repository: { issues } } } = await Vue.apollo.query<{
    repository: Repository
  }>({
    query: queries.archives,
    variables: {
      ...REPOSITORY,
      after,
    },
  })

  const { nodes, pageInfo } = issues

  store.commit(after ? 'ADD_ARCHIVES' : 'SET_ARCHIVES', nodes)

  if (pageInfo.hasNextPage) {
    return fetchArchieves(store, pageInfo.endCursor)
  }
}

interface ArchivesMap {
  [year: number]: Issue[]
}

type ArchivesList = Array<{
  year: number
  archives: Issue[]
}>

@Component({
  asyncData({ store }) {
    return fetchArchieves(store)
  },
})
export default class Archives extends Vue {
  @State('archives') archives: Issue[]

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
