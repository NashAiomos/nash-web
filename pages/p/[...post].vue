<script setup lang="ts">
definePageMeta({ key: route => route.path })

const route = useRoute()
const path = computed(() => {
  const post = route.params.post
  const slug = Array.isArray(post) ? post.join('/') : String(post || '')
  return slug.replace(/\/+$/, '')
})
// Resolve before rendering so missing articles return a real 404, not an indexable empty page.
const { data: article } = await useAsyncData(`article:${path.value}`, () => queryContent(path.value).findOne())
if (!article.value?._path || article.value._partial || article.value._draft || article.value.draft || !article.value.date)
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
</script>

<template>
  <section class="prose relative slide-enter-content">
    <doc-back />
    <doc-render v-if="article" :article="article" />
    <doc-toc v-if="article?.body?.toc" :toc="article.body.toc" />
    <PostComments v-if="article" :key="article._path" :post-path="article._path" />
  </section>
</template>
