<script setup lang="ts">
import { personSchema, serializeSchema, websiteSchema } from '@/utils/seo'

useHead({
  script: [{
    key: 'site-schema',
    type: 'application/ld+json',
    innerHTML: serializeSchema({ '@context': 'https://schema.org', '@graph': [personSchema, websiteSchema] }),
  }],
})
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#777" />
    <NuxtPage />
  </NuxtLayout>
</template>
