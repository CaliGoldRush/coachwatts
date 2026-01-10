<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-red-600">Danger Zone</h2>
      <p class="text-neutral-500">Manage sensitive account settings and data deletion.</p>
    </div>
    <SettingsDangerZone />
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    middleware: 'auth'
  })

  useHead({
    title: 'Danger Zone',
    meta: [{ name: 'description', content: 'Manage sensitive account settings and data deletion.' }]
  })
</script>
