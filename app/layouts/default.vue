<script setup lang="ts">
import { scrollTo } from '~/utils/scroll'

interface InfoPayload {
  user: {
    avatarUrl?: string
    url?: string
    websiteUrl?: string
    login?: string
  } | null
  envs: Record<string, string | string[]>
}

const COLLAPSE_HEIGHT = '222.5px'

const routes = [
  { icon: 'home', link: '' },
  { icon: 'th', link: 'categories' },
  { icon: 'heartbeat', link: 'pulse' },
  { icon: 'user', link: 'about' },
  { icon: 'archive', link: 'archives' },
]

const route = useRoute()
const router = useRouter()
const { t, locale, toggleLocale } = useI18n()
const progress = useState('progress', () => 0)

const { data: info } = await useFetch<InfoPayload>('/api/info', { retry: 0 })
const user = computed(() => info.value?.user ?? null)
const envs = computed(() => info.value?.envs ?? {})
const REPOSITORY = computed(() => ({
  owner: (envs.value.GITHUB_REPOSITORY_OWNER as string) ?? '',
  name: (envs.value.GITHUB_REPOSITORY_NAME as string) ?? '',
}))

// `/api/login` creates the session (and the OAuth `state`) on its own response,
// because a Set-Cookie from an internally fetched route never reaches the browser
const loginHref = computed(() =>
  envs.value.GITHUB_CLIENT_ID
    ? `/api/login?path=${encodeURIComponent(route.fullPath)}`
    : undefined,
)

const search = ref<string | null>((route.query.search as string) ?? null)
const show = ref(false)
const toShow = ref(false)
const collapsing = ref(false)
const collapseHeight = ref<string | null>(null)
let timeoutId: ReturnType<typeof setTimeout> | null = null

const showScrollBtn = ref(false)

const onResize = () => {
  const docEl = document.documentElement
  showScrollBtn.value = docEl.scrollHeight > docEl.clientHeight
}

const toggleShow = () => {
  if (document.documentElement.clientWidth >= 768) {
    return
  }

  if (timeoutId) {
    clearTimeout(timeoutId)
  }

  const next = !show.value
  toShow.value = next
  collapsing.value = false

  if (next) {
    show.value = next
    collapsing.value = true
    timeoutId = setTimeout(() => {
      collapseHeight.value = COLLAPSE_HEIGHT
    })
  } else {
    collapseHeight.value = COLLAPSE_HEIGHT
    timeoutId = setTimeout(() => {
      collapsing.value = true
      collapseHeight.value = null
    })
  }
}

const transitionEnd = () => {
  collapsing.value = false
  collapseHeight.value = null
  show.value = toShow.value
}

const submit = () => {
  if (!search.value) {
    return
  }
  toggleShow()
  router.push({ path: '/', query: { search: search.value } })
}

const scrollToTop = () => scrollTo({ y: 0 })

watch(
  () => route.fullPath,
  () => {
    if (route.path !== '/' || !route.query.search) {
      search.value = null
    }
    nextTick(onResize)
  },
)

onMounted(() => {
  onResize()
  addEventListener('resize', onResize)
  // the legacy server template prevented pinch gestures
  document.addEventListener('gesturestart', preventGesture)
})

onBeforeUnmount(() => {
  removeEventListener('resize', onResize)
  document.removeEventListener('gesturestart', preventGesture)
})

function preventGesture(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <div
    id="app"
    class="container-fluid"
  >
    <HiProgress :progress="progress" />
    <nav class="fixed-top navbar navbar-expand-md">
      <div class="container">
        <NuxtLink
          class="navbar-brand"
          to="/"
        >
          <img
            class="brand-img"
            src="/logo-30.png"
            srcset="/logo-60.png 2x"
            alt="1stG"
          >
          <span class="brand-name"><span>1stg</span></span>
        </NuxtLink>
        <button
          class="navbar-toggler"
          type="button"
          :aria-label="t('toggle_navigation')"
          @click="toggleShow"
        >
          <span class="navbar-toggler-icon" />
        </button>
        <div
          class="navbar-collapse"
          :class="[{ show }, collapsing ? 'collapsing' : 'collapse']"
          :style="{ height: collapseHeight }"
          @transitionend="transitionEnd"
        >
          <ul class="navbar-nav justify-content-end flex-1 pe-md-4">
            <li
              v-for="item of routes"
              :key="item.link"
              class="nav-item d-block d-lg-block"
              :class="{
                active: route.path === `/${item.link}`,
                'd-md-none':
                  (!item.link || item.link === 'pulse') && locale === 'en',
              }"
            >
              <NuxtLink
                class="nav-link"
                :to="`/${item.link}`"
                @click="toggleShow"
              >
                <i
                  class="fa me-2"
                  :class="`fa-${item.icon}`"
                />
                {{ t(item.link || 'home') }}
              </NuxtLink>
            </li>
          </ul>
          <form
            class="d-flex align-items-center my-2 my-md-0"
            @submit.prevent="submit"
          >
            <input
              v-model.trim="search"
              class="form-control me-2 flex-1"
              type="search"
              :placeholder="t('search_all_articles')"
            >
            <button
              class="btn btn-outline-success"
              type="submit"
            >
              {{ t('search') }}
            </button>
            <a
              v-if="user?.login"
              class="ms-2"
              :href="user.websiteUrl || user.url"
              target="_blank"
              rel="noopener"
            >
              <img
                class="user-avatar"
                :src="`${user.avatarUrl}&s=30`"
                :srcset="`${user.avatarUrl}&s=60 2x`"
                alt="user avatar"
              >
            </a>
            <a
              v-else-if="loginHref"
              class="ms-2"
              :href="loginHref"
              rel="noopener"
            >
              {{ t('login') }}
            </a>
          </form>
        </div>
      </div>
    </nav>
    <div class="app-main">
      <div class="container py-4"><slot /></div>
      <button
        v-if="showScrollBtn"
        class="top-btn text-muted"
        @click="scrollToTop"
      >
        Top
      </button>
    </div>
    <footer class="row py-4">
      <div class="container d-flex">
        <div class="flex-1">
          <a
            class="ms-2"
            href="https://www.1stg.me"
            >© 1stg.me</a
          >
          <a
            class="text-secondary ms-2"
            :href="`https://GitHub.com/${REPOSITORY.owner}/${REPOSITORY.name}`"
          >
            <span class="visually-hidden">
              {{ `${REPOSITORY.owner}/${REPOSITORY.name}` }}
            </span>
            <i
              class="fa fa-github"
              aria-hidden="true"
            />
          </a>
          <span
            class="text-secondary ms-2 pointer"
            :title="t('toggle_locale')"
            @click="toggleLocale"
          >
            <span class="visually-hidden">{{ t('toggle_locale') }}</span>
            <i
              class="fa fa-globe"
              aria-hidden="true"
            />
          </span>
        </div>
        <div>
          <i class="fa fa-code me-2" />by
          <a
            class="mx-2"
            href="https://GitHub.com/JounQin"
            >JounQin</a
          >with
          <i class="fa fa-heart ms-2" />
        </div>
      </div>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
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
    background-color: currentColor;
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
    0% {
      transform: translate3d(-100%, 0, 0);
    }

    50% {
      transform: translate3d(-100%, 0, 0);
    }

    100% {
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes slide-right {
    0% {
      transform: translate3d(100%, 0, 0);
    }

    50% {
      transform: translate3d(100%, 0, 0);
    }

    100% {
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes slide-top {
    0% {
      transform: translate3d(0, -100%, 0);
    }

    75% {
      transform: translate3d(0, -100%, 0);
    }

    100% {
      transform: translate3d(0, 0, 0);
    }
  }
}

.app-main {
  min-height: 100%;
  // The wrapper spans the full width so its inner `.container` can re-centre the
  // content, so it has to bleed by exactly the parent container's gutter. That
  // gutter is Bootstrap's `--bs-gutter-x` (1.5rem), which is 10.5px — not 15px —
  // at the 14px root font size, so the old hard-coded `-15px` pushed the wrapper
  // 4.5px past the viewport on both sides and the page always scrolled sideways.
  margin: 0 calc(var(--bs-gutter-x) * -0.5) -63px;
  padding: {
    top: 53px;
    bottom: 63px;
  }
}

// `bg-body-tertiary` would read `--bs-tertiary-bg-rgb`, which still holds
// Bootstrap's own value rather than the token the dark bridge installs
.navbar,
footer {
  background-color: var(--bs-tertiary-bg);
}

@media (max-width: $grid-breakpoints-md) {
  .collapse {
    position: absolute;
    z-index: 1;
    top: 53px;
    left: 0;
    right: 0;
    padding: 0 14px;
    background-color: var(--bs-tertiary-bg);
    box-shadow: 0 1px 1px rgb(0 0 0 / 5%);
  }
}

.top-btn {
  position: fixed;
  right: 20px;
  bottom: 80px;
  padding: 2px 5px;
  border-radius: 2px;
  font-size: 12px;
  border: 1px solid var(--bs-border-color);
  background-color: var(--bs-body-bg);
  z-index: 10001;
}
</style>
