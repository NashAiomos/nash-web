<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { themeStorageKey } from '@/utils/theme'

const isDark = useDark({
  storageKey: themeStorageKey,
  // Let the view transition animate the theme change as a single layer.
  disableTransition: true,
})
const toggleDark = useToggle(isDark)

async function toggleTheme(event: MouseEvent) {
  const root = document.documentElement
  if (root.classList.contains('theme-reveal')) return

  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    toggleDark()
    return
  }

  const button = event.currentTarget as HTMLButtonElement
  const bounds = button.getBoundingClientRect()
  const x = bounds.left + bounds.width / 2
  const y = bounds.top + bounds.height / 2
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

  root.style.setProperty('--theme-reveal-origin', `${x}px ${y}px`)
  root.style.setProperty('--theme-reveal-radius', `${radius}px`)
  root.classList.add('theme-reveal')

  try {
    const transition = document.startViewTransition(async () => {
      toggleDark()
      await nextTick()
    })
    // The browser may skip the animation while still applying the theme.
    void transition.ready.catch(() => {})
    await transition.finished
  } finally {
    root.classList.remove('theme-reveal')
    root.style.removeProperty('--theme-reveal-origin')
    root.style.removeProperty('--theme-reveal-radius')
  }
}
</script>

<template>
  <button
    type="button"
    title="Toggle Color Scheme"
    aria-label="Toggle color scheme"
    class="dark:i-icon-park-outline-moon i-icon-park-outline-sun hover"
    @click="toggleTheme"
  />
</template>

<style>
html.theme-reveal::view-transition-image-pair(root) {
  isolation: auto;
}

html.theme-reveal::view-transition-old(root),
html.theme-reveal::view-transition-new(root) {
  display: block;
  animation: none;
  mix-blend-mode: normal;
}

html.theme-reveal.dark::view-transition-new(root) {
  animation: theme-reveal 300ms ease-in both;
}

html.theme-reveal:not(.dark)::view-transition-old(root) {
  z-index: 1;
  animation: theme-reveal 300ms ease-in reverse both;
}

@keyframes theme-reveal {
  from { clip-path: circle(0 at var(--theme-reveal-origin)); }
  to { clip-path: circle(var(--theme-reveal-radius) at var(--theme-reveal-origin)); }
}
</style>
