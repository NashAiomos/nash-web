<script setup lang="ts">
const route = useRoute()
const event = useRequestEvent()
if (event) setResponseStatus(event, 404)
usePageSeo(() => ({
  title: 'Page Not Found',
  description: 'This page could not be found. Browse the blog or return to Nash Aiomos’s home page.',
  path: route.path,
  noindex: true,
}))
</script>

<template>
  <section class="prose slide-enter-content">
    <h1>Oops! 404</h1>
    <p>You look like you're looking for something that doesn't exist</p>
  </section>
</template>
