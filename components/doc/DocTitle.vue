<script setup lang="ts">
import { formattedDate } from '@/utils'
import { articleAuthor, tagPath } from '@/utils/seo'
import { siteConfig } from '@/site.config'

const props = defineProps(['article'])
</script>

<template>
  <div>
    <h1>{{ props.article.title }}</h1>
    <div class="op-50 mb-4em">
      <div class="flex items-center">
        <i class="i-icon-park-outline-calendar m-r-0.5em" aria-hidden="true" />
        <time :datetime="props.article.date">{{ formattedDate(props.article.date) }}</time>
      </div>
      <div class="m-t-0.5em">
        <a :href="articleAuthor(props.article).url || siteConfig.url" rel="author">{{ articleAuthor(props.article).name }}</a>
      </div>
      <div class="flex flex-wrap gap-2 m-t-0.5em">
        <NuxtLink
          v-for="tag in props.article.tags" :key="tag" :to="tagPath(tag)"
        >
          #{{ tag }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
