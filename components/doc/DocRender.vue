<script setup lang="ts">
import { withoutTrailingSlash } from 'ufo'
import { siteConfig } from '@/site.config'
import { articleAuthor, articlePath, articleUrl, pageUrl, websiteSchema } from '@/utils/seo'

const props = defineProps(['article'])

usePageSeo(() => ({
  title: props.article.title,
  description: props.article.description,
  path: articlePath(props.article._path),
  lang: props.article.lang || 'zh-Hans',
  type: 'article',
  author: articleAuthor(props.article).name,
  published: props.article.date,
  modified: props.article.updated,
  alternates: props.article.alternates,
  schema: [{
    '@type': 'BlogPosting',
    '@id': `${articleUrl(props.article._path)}#article`,
    url: articleUrl(props.article._path),
    mainEntityOfPage: articleUrl(props.article._path),
    headline: props.article.title,
    description: props.article.description,
    inLanguage: props.article.lang || 'zh-Hans',
    datePublished: props.article.date,
    ...(props.article.updated ? { dateModified: props.article.updated } : {}),
    author: articleAuthor(props.article),
    publisher: { '@id': `${siteConfig.url}#person` },
    isPartOf: { '@id': websiteSchema['@id'] },
    keywords: props.article.tags,
  }, {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: pageUrl('/blog/') },
      { '@type': 'ListItem', position: 3, name: props.article.title, item: articleUrl(props.article._path) },
    ],
  }],
}))

function recoverArticle() {
  // Retry stale chunks after client navigation, then let a direct load show the fallback.
  const initialUrl = performance.getEntriesByType('navigation')[0]?.name
  if (initialUrl && withoutTrailingSlash(new URL(initialUrl).pathname) !== withoutTrailingSlash(window.location.pathname))
    reloadNuxtApp()
}

function reloadArticle() {
  reloadNuxtApp({ force: true })
}
</script>

<template>
  <article>
    <DocTitle :article="props.article" />
    <NuxtErrorBoundary @error="recoverArticle">
      <ContentRenderer :value="props.article" />
      <template #error>
        <p role="alert">
          Couldn't load the article.
          <button type="button" class="underline" @click="reloadArticle">
            Reload page
          </button>
        </p>
      </template>
    </NuxtErrorBoundary>
    <doc-footer />
  </article>
</template>
