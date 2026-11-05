<script setup lang="ts">
import { getIncludedYearPosts } from '@/utils'

const { data: posts, error } = await useAsyncData('post-list', getIncludedYearPosts)
</script>

<template>
  <ContentLoadError v-if="error" />
  <ul v-else>
    <template v-for="(article, index) in posts" :key="article._path ?? article.year">
      <div
        v-if="article.isMarked" class="relative pointer-events-none select-none h-20"
        slide-enter :style="{ '--stagger': index + 1 }"
      >
        <span
          class="text-8em font-bold op-15 absolute -top-0.2em -left-0.3em color-transparent text-stroke-2 text-stroke-hex-aaa"
        >{{ article.year }}</span>
      </div>
      <Cell v-else :article="article" slide-enter :style="{ '--stagger': index + 1 }" />
    </template>
  </ul>
</template>
