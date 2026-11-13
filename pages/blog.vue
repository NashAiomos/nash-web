<script setup lang="ts">
import { pageUrl, websiteSchema } from '@/utils/seo'

usePageSeo({
  title: 'Blog — AI Agents, Web3 & Personal Essays',
  description: 'Essays by Nash Aiomos (中子星) on AI coding, agents, Internet Computer, Web3, books, travel, and life, in English and Chinese.',
  path: '/blog/',
  schema: [{ '@type': 'CollectionPage', name: 'Blog', url: pageUrl('/blog/'), isPartOf: { '@id': websiteSchema['@id'] } }],
})
</script>

<template>
  <h1 class="text-title mb-2em font-bold">Blog</h1>
  <post-list />
</template>
