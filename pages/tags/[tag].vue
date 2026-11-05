<script setup lang="ts">
const route = useRoute()
const tag = computed(() => String(route.params.tag ?? ''))
const { data: articles, error } = await useArticleIndex()
const posts = computed(() =>
  (articles.value ?? []).filter(article => article.tags?.includes(tag.value)),
)
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
