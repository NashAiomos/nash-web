<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { themeStorageKey } from '@/utils/theme'

const isDark = useDark({
  storageKey: themeStorageKey,
  // Update all colors together, without full-page snapshots or overlapping transitions.
  disableTransition: true,
})
const toggleDark = useToggle(isDark)
</script>

<template>
  <button
    type="button"
    title="Toggle Color Scheme"
    aria-label="切换浅色或深色模式"
    class="dark:i-icon-park-outline-moon i-icon-park-outline-sun hover"
    @click="toggleDark()"
  />
</template>
