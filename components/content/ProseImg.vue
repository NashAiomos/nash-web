<script setup lang="ts">
import { withBase } from 'ufo'
import { computed, useRuntimeConfig } from '#imports'
import imageVariants from '@/assets/data/image-variants.json'

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
  caption: {
    type: String,
    default: '',
  },
  width: {
    type: [String, Number],
    default: undefined,
  },
  height: {
    type: [String, Number],
    default: undefined,
  },
})

const baseURL = useRuntimeConfig().app.baseURL
const optimized = computed(() => imageVariants[props.src as keyof typeof imageVariants])
const localSrc = (src: string) => src.startsWith('/') && !src.startsWith('//') ? withBase(src, baseURL) : src
const refinedSrc = computed(() => {
  const variants = optimized.value?.variants
  return localSrc(variants ? (variants.find(image => image.width >= 960) || variants[variants.length - 1]).src : props.src)
})

const srcset = computed(() => optimized.value?.variants.map(image => `${localSrc(image.src)} ${image.width}w`).join(', '))
</script>

<template>
  <figure>
    <img :src="refinedSrc" :srcset="srcset" :sizes="srcset ? '(max-width: 800px) calc(100vw - 56px), 740px' : undefined" :data-original-src="localSrc(src)" :alt="alt" :width="width || optimized?.width" :height="height || optimized?.height" loading="lazy" decoding="async">
    <figcaption v-if="caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>
