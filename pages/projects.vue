<script setup lang="ts">
import { projectList } from '@/site.config'

usePageSeo({
  title: 'Projects — IceCube & Constellation Book',
  description: 'Explore Nash Aiomos’s projects: IceCube, a social app on the Internet Computer, and Constellation Book, an illustrated guide to ICP architecture and dApp development.',
  path: '/projects/',
})
</script>

<template>
  <section>
    <h1 class="text-title mb-6 font-bold">
      Projects
    </h1>
    <div class="flex flex-col gap-8">
      <article v-for="(project, index) in projectList" :key="project.name" slide-enter :style="{ '--stagger': index + 1 }">
        <h2 class="mb-2 text-xl font-semibold">
          {{ project.name }}
        </h2>
        <p class="mb-2">
          {{ project.desc }}
        </p>
        <div class="flex flex-wrap items-center gap-x-2 font-medium">
          <template v-for="(link, linkIndex) in project.links" :key="link.href">
            <span v-if="linkIndex > 0" aria-hidden="true">·</span>
            <a :href="link.href" :lang="link.lang" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4">
              {{ link.label }}
            </a>
          </template>
        </div>
      </article>
    </div>
  </section>
</template>
