<script setup lang="ts">
const searchValue = ref('')

// Include the search index in the static payload: GitHub Pages has no query server.
const { data: articles } = await useAsyncData('search-articles', () =>
  queryContent().only(['_path', 'title', 'description', 'tags', 'date']).find(),
)

const queryResult = computed(() => {
  const term = searchValue.value.trim().toLocaleLowerCase()
  if (!term) return []

  return (articles.value ?? []).filter((article) => {
    if (!article.date) return false
    const tags = Array.isArray(article.tags) ? article.tags : []
    return [article.title, article.description, ...tags]
      .some(value => String(value ?? '').toLocaleLowerCase().includes(term))
  })
})
</script>

<template>
  <h1 class="text-title mb-2em font-bold">
    Search
  </h1>
  <div class="slide-enter-content">
    <input v-model="searchValue" placeholder="Search post title / description / tag" class="search-input mb-2em">
    <ul>
      <cell
        v-for="(article, index) in queryResult" :key="article._path" :article="article"
        slide-enter :style="{ '--stagger': index + 1 }"
      />
    </ul>
  </div>
</template>

<style>
.search-input {
  width: 100%;
  padding: 1em;
  background-color: var(--input-bg);
  border-bottom: 2px solid var(--common-bd);
  outline: none;
  transition: var(--common-transition);
}

.search-input:focus {
  border-color: currentcolor;
}
</style>
