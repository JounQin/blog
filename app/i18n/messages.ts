import { Locale } from '#shared/utils/locale'

export const messages: Record<Locale, Record<string, string>> = {
  [Locale.EN]: {
    // App.vue
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
    // src/plugins/translator.ts
    translating: 'Translating',
    ellipsis: '...',
    // Home.vue
    no_content: 'No content{ 0 }',
    in_categories: ' in current categories',
    in_search: ' under current search conditions',
    previous_page: 'Previous',
    next_page: 'Next',
    // Article.vue
    add_comment: 'Add Comment',
    // Categories.vue
    total_categories_count: 'There are { 0 } categories totally now',
    // Archives.vue
    total_archives_count: 'There are { 0 } articles now, keep it up.',
    // Pulse.vue
    created_at: 'Created At',
    merged_at: 'Merged At',
    closed_at: 'Closed At',
    load_more: 'Load More',
  },
  [Locale.ZH]: {
    // App.vue
    home: '首页',
    categories: '分类',
    about: '关于',
    archives: '归档',
    search_all_articles: '搜索全部文章',
    search: '搜索',
    login: '登录',
    toggle_navigation: '切换导航',
    toggle_locale: 'Switch to English',
    // src/plugins/translator.ts
    translating: '翻译中',
    ellipsis: '……',
    // Home.vue
    no_content: '当前{ 0 }暂无内容',
    in_categories: '分类下',
    in_search: '搜索条件下',
    previous_page: '上一页',
    next_page: '下一页',
    // Article.vue
    add_comment: '添加评论',
    // Categories.vue
    total_categories_count: '目前共计 { 0 } 个分类',
    // Archives.vue
    total_archives_count: '目前共计 { 0 } 篇日志，继续努力。',
    // Pulse.vue
    created_at: '创建于',
    merged_at: '合并于',
    closed_at: '关闭于',
    load_more: '加载更多',
  },
}

export type MessageKey = keyof (typeof messages)[Locale.EN]
