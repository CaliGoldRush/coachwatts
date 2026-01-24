<template>
  <div class="space-y-6 p-1">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-bold">Edit Plan Structure</h3>
      <UButton
        color="primary"
        variant="soft"
        icon="i-heroicons-plus"
        size="sm"
        @click="addBlockAtEnd"
      >
        Add Block
      </UButton>
    </div>

    <div class="space-y-4 max-h-[60vh] overflow-y-auto px-1">
      <div
        v-for="(block, index) in localBlocks"
        :key="block.id"
        class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 relative group"
      >
        <!-- Reorder Handles -->
        <div
          class="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <UButton
            v-if="index > 0"
            icon="i-heroicons-chevron-up"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="moveBlock(index, -1)"
          />
          <UButton
            v-if="index < localBlocks.length - 1"
            icon="i-heroicons-chevron-down"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="moveBlock(index, 1)"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Block Name">
            <UInput v-model="block.name" class="w-full" />
          </UFormField>

          <UFormField label="Type">
            <USelect
              v-model="block.type"
              :items="['PREP', 'BASE', 'BUILD', 'PEAK', 'RACE', 'TRANSITION']"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Primary Focus">
            <USelect
              v-model="block.primaryFocus"
              :items="[
                'AEROBIC_ENDURANCE',
                'TEMPO',
                'SWEET_SPOT',
                'THRESHOLD',
                'VO2_MAX',
                'ANAEROBIC_CAPACITY',
                'RECOVERY',
                'MIXED'
              ]"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Duration (Weeks)">
            <UInputNumber v-model="block.durationWeeks" :min="1" :max="12" class="w-full" />
          </UFormField>
        </div>

        <div
          class="mt-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3"
        >
          <div class="text-[10px] text-muted uppercase font-bold tracking-widest">
            Starts: {{ formatDateUTC(calculateBlockStartDate(index)) }}
          </div>
          <UButton
            color="error"
            variant="ghost"
            icon="i-heroicons-trash"
            size="xs"
            @click="removeBlock(index)"
          >
            Delete
          </UButton>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
      <UButton color="neutral" variant="ghost" @click="emit('cancel')">Cancel</UButton>
      <UButton color="primary" :loading="saving" @click="saveChanges">Save Plan Structure</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { format, addWeeks } from 'date-fns'

  const props = defineProps<{
    planId: string
    blocks: any[]
    startDate: string | Date
  }>()

  const emit = defineEmits(['save', 'cancel'])
  const { formatDateUTC } = useFormat()
  const toast = useToast()

  const localBlocks = ref(
    JSON.parse(JSON.stringify(props.blocks)).sort((a: any, b: any) => a.order - b.order)
  )
  const saving = ref(false)

  function calculateBlockStartDate(index: number) {
    let start = new Date(props.startDate)
    for (let i = 0; i < index; i++) {
      start = addWeeks(start, localBlocks.value[i].durationWeeks)
    }
    return start
  }

  function addBlockAtEnd() {
    localBlocks.value.push({
      id: `new-${Date.now()}`,
      name: 'New Phase',
      type: 'BASE',
      primaryFocus: 'AEROBIC_ENDURANCE',
      durationWeeks: 4,
      order: localBlocks.value.length + 1,
      isNew: true
    })
  }

  function removeBlock(index: number) {
    if (localBlocks.value.length <= 1) {
      toast.add({ title: 'Plan must have at least one block', color: 'error' })
      return
    }
    localBlocks.value.splice(index, 1)
  }

  function moveBlock(index: number, delta: number) {
    const newIndex = index + delta
    if (newIndex < 0 || newIndex >= localBlocks.value.length) return

    const temp = localBlocks.value[index]
    localBlocks.value[index] = localBlocks.value[newIndex]
    localBlocks.value[newIndex] = temp
  }

  async function saveChanges() {
    saving.value = true
    try {
      // We'll perform a multi-step update to ensure consistency
      // Actually, to make it robust, we'll implement a 'replan' endpoint that takes the whole structure
      // But since we want to reuse our CRUD APIs, we'll do:
      // 1. Identify deleted blocks -> Call DELETE
      // 2. Identify new blocks -> Call POST
      // 3. Update existing blocks -> Call PATCH
      // 4. Update orders -> Call Reorder PUT

      // SIMPLIFIED: We'll create a single "REPLAN" endpoint that takes the new structure
      // and rebuilds the plan structure in one transaction. This is much safer than multiple HTTP calls.

      await $fetch(`/api/plans/${props.planId}/replan-structure`, {
        method: 'POST',
        body: {
          blocks: localBlocks.value.map((b: any, idx: number) => ({
            ...b,
            order: idx + 1
          }))
        }
      })

      toast.add({ title: 'Plan structure updated', color: 'success' })
      emit('save')
    } catch (error: any) {
      toast.add({
        title: 'Failed to update plan',
        description: error.data?.message || 'Unknown error',
        color: 'error'
      })
    } finally {
      saving.value = false
    }
  }
</script>
