<script setup lang="ts">
definePageMeta({
  middleware: () => navigateTo('/blog', { redirectCode: 301, replace: true }),
})
</script>
