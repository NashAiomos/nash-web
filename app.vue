<script setup lang="ts">
import { siteConfig } from '@/site.config'

useHead({ title: siteConfig.title, htmlAttrs: { lang: siteConfig.lang } })
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#777" />
    <NuxtPage />
  </NuxtLayout>
</template>
