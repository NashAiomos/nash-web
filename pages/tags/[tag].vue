<script setup lang="ts">
import { tagPath } from '@/utils/seo'

const route = useRoute()
const tag = computed(() => String(route.params.tag ?? ''))
const { data: articles, error } = await useArticleIndex()
const posts = computed(() =>
  (articles.value ?? []).filter(article => article.tags?.includes(tag.value)),
)
usePageSeo(() => ({
  title: `${tag.value} — Articles`,
  description: `Read ${posts.value.length} articles about ${tag.value} by Nash Aiomos (中子星). Browse essays, development notes, and personal experiences.`,
  path: tagPath(tag.value),
  noindex: !posts.value.length,
}))
</script>

<template>
  <div>
    <h1 class="text-title mb-2em">
      <NuxtLink to="/tags" class="hover">
        Tags
      </NuxtLink> / {{ tag }}
    </h1>
    <ContentLoadError v-if="error" />
    <ul v-else-if="posts?.length">
      <cell v-for="article in posts" :key="article._path" :article="article" />
    </ul>
    <p v-else class="text-2xl text-center">
      Not Found Any Document😗
    </p>
  </div>
</template>
