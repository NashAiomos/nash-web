// https://nuxt.com/docs/api/configuration/nuxt-config
import { siteConfig } from './site.config'
import { themeInitScript } from './utils/theme'
import { siteUrl } from './utils/seo'

export default defineNuxtConfig({
  // 启用 SSR，这对静态生成很重要
  ssr: true,

  // 配置 Nitro 引擎为静态生成
  nitro: {
    preset: 'github-pages',
    // 确保所有路由都被预渲染
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: ['/', '/blog/', '/projects/', '/tags/', '/p/', '/article-index.json', '/rss.xml', '/sitemap.xml', '/robots.txt', '/llms.txt', '/content.json']
    },
    hooks: {
      'prerender:generate'(route) {
        // Nuxt emits these static SPA fallbacks without running page-level head logic.
        if (['/404.html', '/200.html'].includes(route.route) && route.contents)
          route.contents = route.contents.replace('</head>', '<meta name="robots" content="noindex, follow"></head>')
      },
    },
  },

  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@nuxt/content',
    '@nuxtjs/stylelint-module',
  ],

  runtimeConfig: {
    public: {
      commentsApiUrl: 'https://nash-web-comments.nashaiomos.workers.dev',
    },
  },

  app: {
    baseURL: '/nash-web/', // 确保这个路径正确
    buildAssetsDir: '/assets/', // 设置资源目录
    rootId: 'nuxt-root',
    head: {
      meta: [
        { name: 'description', content: siteConfig.description },
        { name: 'author', content: siteConfig.author },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'msapplication-TileColor', content: '#ffffff' },
        { charset: 'UTF-8' },
        { 'http-equiv': 'X-UA-Compatible', 'content': 'IE=edge' },
      ],
      htmlAttrs: {
        lang: siteConfig.lang,
      },
      bodyAttrs: {
        class: 'font-sans',
      },
      script: [
        { key: 'theme-init', innerHTML: themeInitScript, tagPriority: 'critical' },
        // 放大查看图片
        { src: '/nash-web/bigimg.js' },
        { src: '/nash-web/custom.js' },
      ],
      // 添加链接标签以确保CSS正确加载
      link: [
        { rel: 'icon', href: '/nash-web/favicon.ico' },
        { rel: 'alternate', type: 'application/rss+xml', title: siteConfig.title, href: '/nash-web/rss.xml' },
        { rel: 'sitemap', type: 'application/xml', href: siteUrl('sitemap.xml') },
        { rel: 'help', type: 'text/plain', title: 'AI and agent content guide', href: siteUrl('llms.txt') },
      ]
    },
  },

  content: {
    // All page metadata is managed by usePageSeo, including client navigation.
    contentHead: false,
    highlight: {
      theme: {
        // Default theme (same as single string)
        default: 'vitesse-light',
        // Theme used if `html.dark`
        dark: 'vitesse-dark',
        // Theme used if `html.sepia`
        sepia: 'monokai',
      },
      preload: [
        'c',
        'cpp',
        'java',
      ],
    },
  },

  css: [
    '@unocss/reset/tailwind.css',
    '@/assets/styles/global.scss',
    '@/assets/styles/theme.css',
    '@/assets/styles/transition.css',
    '@/assets/styles/markdown.scss',
  ],

  // 确保CSS被正确提取
  vite: {
    css: {
      // 如果使用预处理器，可以在这里配置
      preprocessorOptions: {
        scss: {
          // 如果有全局SCSS变量文件
          // additionalData: '@import "@/assets/styles/variables.scss";'
        }
      }
    }
  },

  stylelint: {
    /* module options */
    lintOnStart: false,
  },

  // 确保UnoCSS正确生成
  unocss: {
    // 确保UnoCSS的所有功能都正确启用
    autoImport: true,
  },

  compatibilityDate: '2025-02-28',
})
