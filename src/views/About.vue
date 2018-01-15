<template lang="pug">
main
  blockquote.d-flex.align-items-center.justify-content-center.text-secondary.quote(:class="$style.profile")
    a(:href="owner.url")
      img.mr-2(:src="owner.avatarUrl", :class="$style.avatar")
    .text-left
      a(:href="owner.url") {{ owner.name }}
      template(v-if="owner.email") ({{ owner.email }})
      template(v-if="owner.bio || owner.description") :
        br
        | {{ owner.bio || owner.description }}
  .d-flex.mb-2
    .flex-1
      i.fa.fa-location-arrow.mr-2
      | {{ owner.location }}
    .flex-1.text-right
      i.fa.fa-link.mr-2
      a(:href="owner.websiteUrl || owner.url") {{ owner.websiteUrl || owner.url }}
  ul.list-unstyled(:class="$style.repositories")
    li.mt-3.mt-md-4(v-for="{ description, id, nameWithOwner, stargazers, url } of owner.pinnedRepositories.nodes", :key="id")
      .card.flex-1
        .card-body
          h5.card-title
            a(:href="url")
              span.mr-2 {{ nameWithOwner.replace(login + '/', '') }}
              small
                i.fa.fa-star.mr-1
                | {{ stargazers.totalCount }}
          .card-text
            span.text-secondary {{ description }}
</template>
<script lang="ts">
import gql from 'graphql-tag'
import { Component, Vue } from 'vue-property-decorator'
import { State } from 'vuex-class'

import { Owner } from 'types'
import { IS_USER, LOGIN, OWNER_TYPE } from 'utils'

@Component({
  async asyncData({ store }) {
    const { apollo } = Vue

    const { data: owner } = await apollo.query<{
      [ownerType: string]: Owner
    }>({
      query: gql(`query pinnedRepositories($login: String!) {
  ${OWNER_TYPE}(login: $login) {
    avatarUrl(size: 100)
    ${IS_USER ? 'bio company' : 'description'}
    email
    id
    location
    name
    resourcePath
    url
    websiteUrl
    pinnedRepositories(first: 6) {
      nodes {
        description
        id
        nameWithOwner
        url
        stargazers {
          totalCount
        }
      }
    }
  }
}`),
      variables: LOGIN,
    })

    store.commit('SET_OWNER', owner[OWNER_TYPE])
  },
})
export default class About extends Vue {
  @State('owner') owner: Owner

  login = LOGIN.login
}
</script>
<style lang="scss" module>
.avatar {
  width: 40px;
  height: 40px;
}

.repositories {
  display: flex;
  flex-wrap: wrap;
  margin-right: -20px;
  margin-bottom: 0;

  > li {
    display: flex;
    width: 50%;

    @media (max-width: 768px) {
      width: 100%;
    }

    :global(.card) {
      margin-right: 20px;
    }
  }
}
</style>