<template>
  <UModal :open="modelValue" @update:open="$emit('update:modelValue', $event)" title="Plan Week with AI">
    <template #body>
      <div class="p-6 space-y-4">
        <p class="text-sm text-muted">
          Tell the AI about your availability, constraints, or specific goals for this week.
          It will regenerate the week's workouts based on your instructions.
        </p>
        
        <UFormField label="Instructions">
          <UTextarea 
            v-model="instructions" 
            placeholder="e.g. I want 3 gym sessions this week, no swimming on Tuesday, and a long ride on Sunday." 
            class="w-full h-32"
            autofocus
          />
        </UFormField>
        
        <div class="flex justify-end gap-2 mt-4">
          <UButton color="neutral" variant="ghost" @click="$emit('update:modelValue', false)">Cancel</UButton>
          <UButton color="primary" :loading="loading" @click="generatePlan" icon="i-heroicons-sparkles">
            Generate Plan
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  loading?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'generate'])

const instructions = ref('')

function generate() {
  if (!instructions.value.trim()) return
  
  emit('generate', instructions.value)
  // Don't close modal immediately, let parent handle success/loading state
}

// Alias for button click
const generatePlan = generate
</script>
