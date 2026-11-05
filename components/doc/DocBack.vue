<script lang="ts" setup>
function backTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="pr-2em xl:(absolute top-0 right-full h-full)">
    <div class="sticky top-14 w-8em">
      <button type="button" class="block cursor-pointer" @click="$router.back()">
        <div class="i-icon-park-outline-left-small-up" /> Back
      </button>

      <button type="button" class="hidden xl:block cursor-pointer" @click="backTop">
        <div class="i-icon-park-outline-to-top-one" /> To Top
      </button>
    </div>
  </div>
</template>
