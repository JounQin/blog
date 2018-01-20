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

import { Owner } from 'types'
import { IS_USER, LOGIN, OWNER_TYPE } from 'utils'

const queryOptions = {
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
}

@Component({
  asyncData: ({ apollo }) => apollo.query(queryOptions),
  title: (vm: About) => vm.$t('about'),
  translator: {
    en: {
      about: 'About',
    },
    zh: {
      about: '关于',
    },
  },
})
export default class About extends Vue {
  get owner(): Owner {
    return this.$apollo.readQuery<{
      [ownerType: string]: Owner
    }>(queryOptions)[OWNER_TYPE]
  }

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

    :global(.card) {
      margin-right: 20px;
    }
  }

  @media (max-width: 768px) {
    margin-right: 0;

    > li {
      width: 100%;

      :global(.card) {
        margin-right: 0;
      }
    }
  }
}
</style>
