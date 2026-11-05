<script setup lang="ts">
const { data: posts, error } = await useArticleIndex()

const tagsContent = computed(() => (posts.value ?? [])
  .filter(post => Array.isArray(post.tags) && !/(readme|about)\.md$/i.test(post._file ?? ''))
  .reduce((counts, post) => {
    for (const tag of post.tags)
      counts[tag] = (counts[tag] ?? 0) + 1
    return counts
  }, {} as Record<string, number>))
</script>

<template>
  <h1 class="text-title mb-2em font-bold">
    Tags
  </h1>
  <ContentLoadError v-if="error" />
  <ul v-else class="flex gap-1em flex-wrap">
    <li v-for="(value, key, index) in tagsContent" :key="key" slide-enter :style="{ '--stagger': index + 1 }" class="px-2 bg-gray-400:20 rd-1">
      <NuxtLink :to="`/tags/${key}`" class="flex gap-2">
        <span class="hover">#{{ key }}</span>
        <span>{{ value }}</span>
      </NuxtLink>
    </li>
  </ul>
</template>
