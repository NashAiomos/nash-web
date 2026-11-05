<script setup lang="ts">
import { getIncludedYearPosts } from '@/utils'

const { data: groups, error } = await useAsyncData('post-list', getIncludedYearPosts)
</script>

<template>
  <ContentLoadError v-if="error" />
  <div v-else>
    <section v-for="(group, index) in groups" :key="group.year" :aria-labelledby="`year-${group.year}`">
      <h2
        :id="`year-${group.year}`" class="relative pointer-events-none select-none h-20"
        slide-enter :style="{ '--stagger': index + 1 }"
      >
        <span class="text-8em font-bold op-15 absolute -top-0.2em -left-0.3em color-transparent text-stroke-2 text-stroke-hex-aaa">{{ group.year }}</span>
      </h2>
      <ul>
        <Cell v-for="(article, articleIndex) in group.articles" :key="article._path" :article="article" slide-enter :style="{ '--stagger': articleIndex + 1 }" />
      </ul>
    </section>
  </div>
</template>
