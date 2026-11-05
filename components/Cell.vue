<script setup lang="ts">
import { formattedDate } from '@/utils'

const props = defineProps(['article'])
</script>

<template>
  <li class="list-none mb-6 mt-2">
    <NuxtLink :to="`/p${props.article._path}`" :title="props.article.title" class="hover flex flex-col md:(gap-2 flex-row items-center)">
      <span class="text-lg">
        {{ props.article.title }}
      </span>
      <span class="text-sm op-70">
        {{ formattedDate(props.article.date) }}
      </span>
    </NuxtLink>
  </li>
</template>
