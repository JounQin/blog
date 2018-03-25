<template lang="pug">
#app.container-fluid
  hi-progress(:progress="progress")
  nav.fixed-top.navbar.navbar-expand-md.navbar-light.bg-light
    .container
      router-link.navbar-brand(to="/")
        img.brand-img(src="/logo-30.png", srcset="/logo-60.png 2x", alt="1stG")
        span(:class="$style.brandName")
          span 1stg
      button.navbar-toggler(:aria-label="$t('toggle_navigation')", type="button", @click="toggleShow")
        span.navbar-toggler-icon
      .navbar-collapse(:class="[$style.collapse, { show }, `collaps${collapsing ? 'ing' : 'e'}`]"
                        :style="{ height: collapseHeight }"
                        @transitionend="transitionEnd")
        ul.navbar-nav.justify-content-end.flex-1.pr-md-4
          router-link.nav-item.d-block.d-lg-block(v-for="{ icon, link, text } of routes"
                                                  :class="{ active: $route.fullPath.split('?')[0] === '/' + link, 'd-md-none': (!link || link === 'pulse') && $t.locale === 'en' }"
                                                  :to="'/' + link"
                                                  :key="link"
                                                  tag="li"
                                                  @click.native="toggleShow")
            a.nav-link
              i.fa.mr-2(:class="`fa-${ icon }`")
              | {{ $t(link || 'home') }}
        form.form-inline.my-2.my-md-0(@submit.prevent="submit")
          input.form-control.mr-2.flex-1(v-model.trim="search", type="search" :placeholder="$t('search_all_articles')")
          button.btn.btn-outline-success(type="submit") {{ $t('search') }}
          a.ml-2(v-if="user"
                  :href="user.uuid ? `https://github.com/login/oauth/authorize?client_id=${ GITHUB_CLIENT_ID }&state=${user.uuid}&redirect_uri=${ GITHUB_OAUTH_CALLBACK }?path=${ $route.fullPath }` : user.websiteUrl || user.url"
                  :target="user.uuid ? '_self' : '_blank'"
                  rel="noopener")
            template(v-if="user.uuid") {{ $t('login') }}
            img.user-avatar(v-else, :src="user.avatarUrl + '&s=30'", :srcset="user.avatarUrl + '&s=60 2x'")
  div(:class="$style.main")
    router-view.container.py-4
    button.text-muted(v-if="showScrollBtn", :class="$style.top", @click="scrollToTop") Top
  footer.row.py-4.bg-light
    .container.d-flex
      .flex-1
        a.ml-2(href="https://www.1stg.me") © 1stg.me
        a.text-secondary.ml-2(:href="`https://GitHub.com/${REPOSITORY.owner}/${REPOSITORY.name}`")
          .sr-only {{ REPOSITORY.owner + '/' + REPOSITORY.name }}
          i.fa.fa-github(aria-hidden="true")
        a.text-secondary.ml-2(href="javascript:;", :title="$t('toggle_locale')")
          .sr-only {{ $t('toggle_locale') }}
          i.fa.fa-globe(aria-hidden="true", @click="$t.toggleLocale")
      div
        i.fa.fa-code.mr-2
        | by
        a.mx-2(href="https://GitHub.com/JounQin") JounQin
        | with
        i.fa.fa-heart.ml-2
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Getter, State } from 'vuex-class'

import HiProgress from 'components/HiProgress.vue'

import { RootState, User } from 'types'

const COLLAPSE_HEIGHT = '222.5px'

@Component({
  translator: {
    en: {
      home: 'Home',
      categories: 'Categories',
      pulse: 'Pulse',
      about: 'About',
      archives: 'Archives',
      search_all_articles: 'Search All Articles',
      search: 'Search',
      login: 'Login',
      toggle_navigation: 'Toggle Navigation',
      toggle_locale: '切换至中文',
    },
    zh: {
      home: '首页',
      categories: '分类',
      about: '关于',
      archives: '归档',
      search_all_articles: '搜索全部文章',
      search: '搜索',
      login: '登录',
      toggle_navigation: '切换导航',
      toggle_locale: 'Switch to English',
    },
  },
  components: {
    HiProgress,
  },
})
export default class App extends Vue {
  @Getter
  REPOSITORY: {
    name: string
    owner: string
  }

  @State((state: RootState) => state.envs.GITHUB_CLIENT_ID)
  GITHUB_CLIENT_ID: string
  @State((state: RootState) => state.envs.GITHUB_OAUTH_CALLBACK)
  GITHUB_OAUTH_CALLBACK: string

  @State progress: number
  @State user: User

  routes = [
    {
      icon: 'home',
      link: '',
    },
    {
      icon: 'th',
      link: 'categories',
    },
    {
      icon: 'heartbeat',
      link: 'pulse',
    },
    {
      icon: 'user',
      link: 'about',
    },
    {
      icon: 'archive',
      link: 'archives',
    },
  ]

  search: string = null
  show = false
  toShow = false
  collapsing = false
  collapseHeight: string = null
  timeoutId: number = null

  showScrollBtn = false

  @Watch('$route')
  routeChange() {
    const { path, query: { search } } = this.$route
    if (path !== '/' || !search) {
      this.search = null
    }
    this.$nextTick(this.onResize)
  }

  created() {
    this.search = this.$route.query.search
  }

  mounted() {
    this.onResize()
    addEventListener('resize', this.onResize)
  }

  onResize() {
    const docEl = document.documentElement
    this.showScrollBtn = docEl.scrollHeight > docEl.clientHeight
  }

  scrollToTop() {
    const { scrollTop } = document.documentElement
    this.scroll(scrollTop / 60)
  }

  scroll(step: number) {
    if (document.documentElement.scrollTop <= 0) {
      return
    }

    requestAnimationFrame(() => {
      document.documentElement.scrollTop -= step
      this.scroll(step)
    })
  }

  toggleShow() {
    if (document.documentElement.clientWidth >= 768) {
      return
    }

    clearTimeout(this.timeoutId)

    const show = !this.show
    this.toShow = show
    this.collapsing = false

    if (show) {
      this.show = show
      this.collapsing = true
      this.timeoutId = setTimeout(() => {
        this.collapseHeight = COLLAPSE_HEIGHT
      })
    } else {
      this.collapseHeight = COLLAPSE_HEIGHT
      this.timeoutId = setTimeout(() => {
        this.collapsing = true
        this.collapseHeight = null
      })
    }
  }

  transitionEnd() {
    this.collapsing = false
    this.collapseHeight = null
    this.show = this.toShow
  }

  submit() {
    if (this.search) {
      this.toggleShow()
      this.$router.push(`/?search=${this.search}`)
    }
  }
}
</script>
<style lang="scss">
@import '~font-awesome/css/font-awesome.css';
@import '~github-markdown-css';
@import '~typeface-lato';
@import '~styles/bootstrap';

html,
body,
#app {
  height: 100%;
}

html {
  font-size: 14px;
}

body {
  font-family: Lato, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

button:focus {
  outline: 0;
}

.flex-1 {
  flex: 1;
}

.scroll-y {
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.clickable {
  cursor: pointer;
}

.heading-link {
  display: inline-block;
  word-break: break-word;

  @media (min-width: $grid-breakpoints-md + 1px) {
    &:hover:after {
      width: 100%;
    }

    &:after {
      content: '';
      display: block;
      margin-left: auto;
      margin-right: auto;
      width: 0;
      height: 2px;
      background-color: $link-hover-color;
      transition: width 0.5s ease;
    }
  }
}

.brand-img,
.user-avatar {
  width: 30px;
  height: 30px;
}

.avatar-img {
  width: 50px;
  height: 50px;

  @media (max-width: $grid-breakpoints-md) {
    width: 32px;
    height: 32px;
  }
}

.comment-body {
  font-size: 14px;
}

.media-body {
  min-width: 0;
}

.markdown-body > *:last-child {
  margin-bottom: 0 !important;
}

.quote {
  position: relative;
  text-align: center;
  padding: 20px 0;

  &:before,
  &:after {
    position: absolute;
    z-index: -1;
    width: 100%;
    left: 0;
    font-size: 24px;
    color: lightgray;
  }

  &:before {
    content: '“';
    top: 0;
    text-align: left;
    border-top: 1px solid lightgray;
  }

  &:after {
    content: '”';
    bottom: 0;
    text-align: right;
    border-bottom: 1px solid lightgray;
    line-height: 0;
  }
}
</style>
<style lang="scss" module>
.brand-name {
  display: inline-block;
  vertical-align: middle;
  margin-left: 10px;
  font-weight: bolder;
  overflow: hidden;

  &:before,
  &:after {
    content: '';
    display: block;
    height: 2px;
    background-color: $link-color;
    animation: 1s ease;
  }

  &:before {
    animation-name: slide-left;
  }

  &:after {
    animation-name: slide-right;
  }

  > span {
    display: inline-block;
    animation: slide-top 1.5s ease;
  }

  @keyframes slide-left {
    from {
      transform: translate3d(-100%, 0, 0);
    }

    50% {
      transform: translate3d(-100%, 0, 0);
    }

    to {
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes slide-right {
    from {
      transform: translate3d(100%, 0, 0);
    }

    50% {
      transform: translate3d(100%, 0, 0);
    }

    to {
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes slide-top {
    from {
      transform: translate3d(0, -100%, 0);
    }

    75% {
      transform: translate3d(0, -100%, 0);
    }

    to {
      transform: translate3d(0, 0, 0);
    }
  }
}

.main {
  min-height: 100%;
  margin: 0 -15px -63px -15px;
  padding-top: 53px;
  padding-bottom: 63px;
}

@media (max-width: $grid-breakpoints-md) {
  .collapse {
    position: absolute;
    z-index: 1;
    top: 53px;
    left: 0;
    right: 0;
    padding: 0 14px;
    background-color: #f8f9fa;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
  }
}

.top {
  position: fixed;
  right: 20px;
  bottom: 80px;
  padding: 2px 5px;
  border-radius: 2px;
  font-size: 12px;
  border: 1px solid $border-color;
  background-color: #fff;
  z-index: 10001;
}
</style>
