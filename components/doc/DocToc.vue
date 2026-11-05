<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

const props = defineProps(['toc'])
const currentId = ref('')

onMounted(() => {
  function handleScroll() {
    const links = (props.toc?.links ?? []).flatMap((heading: any) => [heading, ...(heading.children ?? [])])
    const headings = links.map((heading: any) => document.getElementById(heading.id)).filter(Boolean) as HTMLElement[]
    let active = headings[0]?.id || ''
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= 120) active = heading.id
    }
    currentId.value = active
  }
  useEventListener(window, 'scroll', handleScroll, { passive: true })
  useEventListener(window, 'resize', handleScroll)
  watch(() => props.toc, () => nextTick(handleScroll), { deep: true })
  handleScroll()
})
</script>

<template>
  <div v-if="props.toc?.links?.length" class="doc-toc">
    <nav aria-label="Table of contents">
      <ul>
        <li v-for="h2 in props.toc.links" :key="h2.id">
          <a :href="`#${h2.id}`" :aria-current="h2.id === currentId ? 'location' : undefined">{{ h2.text }}</a>
          <ul v-if="h2.children?.length">
            <li v-for="h3 in h2.children" :key="h3.id">
              <a :href="`#${h3.id}`" :aria-current="h3.id === currentId ? 'location' : undefined">{{ h3.text }}</a>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.doc-toc {
  display: none;
}

@media (width >= 1280px) {
  .doc-toc {
    position: absolute;
    top: 0;
    left: 100%;
    display: block;
    width: min(22rem, calc((100vw - 100%) / 2 - 1rem));
    height: 100%;
    padding-left: 2rem;
  }
}

nav {
  position: sticky;
  top: 3.5rem;
  max-height: calc(100vh - 5rem);
  overflow: auto;
  overflow-wrap: anywhere;
}

ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

ul ul {
  padding-left: 1rem;
}

a {
  display: block;
  padding: 0.2rem 0.5rem;
  border-left: 2px solid transparent;
}

a[aria-current] {
  font-weight: bold;
  border-left-color: currentcolor;
}
</style>
