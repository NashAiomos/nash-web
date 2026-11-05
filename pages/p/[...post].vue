<script setup lang="ts">
const route = useRoute()
const path = computed(() => {
  const post = route.params.post
  const slug = Array.isArray(post) ? post.join('/') : String(post || '')
  return slug.replace(/\/+$/, '')
})
</script>

<template>
  <section class="prose relative slide-enter-content">
    <ContentDoc :path="path">
      <template #default="{ doc }">
        <doc-back />
        <doc-render :article="doc" />
        <doc-toc :toc="doc.body.toc" />
        <PostComments :key="doc._path" :post-path="doc._path" />
      </template>

      <template #empty>
        <h1 class="text-center">
          Document is empty
        </h1>
      </template>

      <template #not-found>
        <h1 class="text-center">
          Not Found Any Document😗
        </h1>
      </template>
    </ContentDoc>
  </section>
</template>
