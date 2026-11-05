<script setup lang="ts">
function reloadPage() {
  reloadNuxtApp({ force: true })
}
</script>

<template>
  <p role="alert">
    Couldn't load this page.
    <button type="button" class="underline" @click="reloadPage">
      Reload page
    </button>
  </p>
</template>
