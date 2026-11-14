<script setup lang="ts">
import { siteConfig } from '@/site.config'
import { personSchema, websiteSchema } from '@/utils/seo'

usePageSeo({
  title: 'Nash Aiomos — Software Engineer & Writer',
  description: siteConfig.description,
  path: '/',
  type: 'profile',
  schema: [{
    '@type': 'ProfilePage',
    '@id': `${siteConfig.url}#profile`,
    url: siteConfig.url,
    name: siteConfig.title,
    mainEntity: { '@id': personSchema['@id'] },
    isPartOf: { '@id': websiteSchema['@id'] },
  }],
})
</script>

<template>
  <section class="prose ">
    <ContentDoc path="me" class="slide-enter-content" />
  </section>
</template>
