<script setup lang="ts">
import { withoutTrailingSlash } from 'ufo'

const props = defineProps(['article'])

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
</template>
