<script setup lang="ts">
import { siteConfig } from '@/site.config'
import { withBase } from 'ufo'

const rssUrl = withBase('/rss.xml', useRuntimeConfig().app.baseURL)
</script>

<template>
  <footer class="pt-5em">
    <div class="flex items-center flex-col md:flex-row gap-1em">
      <span class="op-50 text-sm">
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer" class="link">
          CC BY-NC-SA 4.0
        </a>
        2020-PRESENT © {{ siteConfig.author }}
      </span>
      <a :href="rssUrl" class="link text-sm">RSS</a>
    </div>
  </footer>
</template>
