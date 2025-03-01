// https://nuxt.com/docs/api/configuration/nuxt-config
import { siteConfig } from './site.config'

export default defineNuxtConfig({
  // 启用 SSR，这对静态生成很重要
  ssr: true,

  // 配置 Nitro 引擎为静态生成
  nitro: {
    preset: 'github-pages',
    // 确保所有路由都被预渲染
    prerender: {
      crawlLinks: true,
      routes: ['/']
    }
  },

  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@nuxt/content',
    '@nuxtjs/stylelint-module',
  ],

  app: {
    baseURL: '/nash-web/', // 确保这个路径正确
    buildAssetsDir: '/assets/', // 设置资源目录
    rootId: 'nuxt-root',
    head: {
      meta: [
        { name: 'description', content: siteConfig.description },
        { name: 'author', content: siteConfig.author },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'revisit-after', content: '7 days' },
        { name: 'msapplication-TileColor', content: '#ffffff' },
        { charset: 'UTF-8' },
        { 'http-equiv': 'X-UA-Compatible', 'content': 'IE=edge' },
      ],
      noscript: [
        { children: 'JavaScript is required' },
      ],
      htmlAttrs: {
        lang: siteConfig.lang,
      },
      bodyAttrs: {
        class: 'font-sans',
      },
      script: [ // 放大查看图片
        { src: '/nash-web/bigimg.js' },
        { src: '/nash-web/custom.js' },
      ],
      // 添加链接标签以确保CSS正确加载
      link: [
        { rel: 'stylesheet', href: 'css/main.css' }, // 如果有额外的CSS文件
        { rel: 'icon', href: '/nash-web/favicon.ico' },
      ]
    },
  },

  content: {
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