<template>
  <div
    v-if="coachingStore.isCoachingMode"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-primary-600 text-white py-2 px-4 rounded-full shadow-xl flex items-center gap-4 border border-white/20 whitespace-nowrap"
  >
    <div class="flex items-center gap-2 text-sm font-medium">
      <UIcon name="i-heroicons-eye" class="w-5 h-5" />
      <span
        >Viewing as <strong>{{ coachingStore.actingAsUserName }}</strong></span
      >
    </div>
    <div class="flex items-center gap-4">
      <UButton
        color="neutral"
        variant="solid"
        size="xs"
        label="Exit"
        @click="coachingStore.stopActingAs"
      />
    </div>
  </div>
</template>

<script setup>
  const coachingStore = useCoachingStore()
</script>
