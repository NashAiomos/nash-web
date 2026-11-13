<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const route = useRoute()
usePageSeo(() => ({
  title: props.error.statusCode === 404 ? 'Page Not Found' : 'Unable to Load Page',
  description: 'Browse the blog or return to Nash Aiomos’s home page.',
  path: route.path,
  noindex: true,
}))
</script>

<template>
  <NuxtLayout>
    <section class="prose">
      <h1>{{ error.statusCode === 404 ? 'Page not found' : 'Unable to load this page' }}</h1>
      <p>The requested page could not be loaded.</p>
      <button type="button" class="underline" @click="clearError({ redirect: '/blog/' })">Browse the blog</button>
    </section>
  </NuxtLayout>
</template>
