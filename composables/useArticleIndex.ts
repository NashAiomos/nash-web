export function useArticleIndex() {
  const { app } = useRuntimeConfig()

  // This file is generated with the site and is available without a Nuxt server.
  return useAsyncData('article-index', () => $fetch('/article-index.json', { baseURL: app.baseURL }))
}
