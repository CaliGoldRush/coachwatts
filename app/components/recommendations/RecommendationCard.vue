<template>
  <UCard
    class="flex flex-col h-full transition-all duration-200"
    :class="[recommendation.isPinned ? 'ring-2 ring-primary-500 bg-primary-50/10' : '']"
    :ui="{
      body: 'flex-1',
      footer: 'h-14 flex items-center shrink-0 border-t border-gray-100 dark:border-gray-800'
    }"
  >
    <template #header>
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-2">
          <UBadge :color="priorityColor" variant="subtle" size="xs">
            {{ recommendation.priority.toUpperCase() }}
          </UBadge>
          <UBadge color="gray" variant="soft" size="xs">
            {{ recommendation.sourceType }} / {{ recommendation.metric }}
          </UBadge>
        </div>
        <div class="flex gap-1">
          <UTooltip :text="recommendation.isPinned ? 'Unpin' : 'Pin to Focus'">
            <UButton
              :icon="
                recommendation.isPinned ? 'i-heroicons-paper-clip-solid' : 'i-heroicons-paper-clip'
              "
              color="gray"
              variant="ghost"
              size="xs"
              class="hover:text-primary-500"
              @click="$emit('toggle-pin', recommendation)"
            />
          </UTooltip>
          <UDropdown :items="menuItems">
            <UButton icon="i-heroicons-ellipsis-vertical" color="gray" variant="ghost" size="xs" />
          </UDropdown>
        </div>
      </div>
    </template>

    <div class="h-full flex flex-col justify-between">
      <div>
        <h3 class="font-semibold text-lg mb-2 line-clamp-2">{{ recommendation.title }}</h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap line-clamp-4">
          {{ recommendation.description }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center w-full text-xs text-gray-500">
        <div class="flex items-center gap-3">
          <UTooltip :text="`Generated ${formatDate(recommendation.generatedAt)}`">
            <span class="cursor-default">{{
              formatDate(recommendation.generatedAt, 'MMM d')
            }}</span>
          </UTooltip>
          <AiFeedback
            v-if="recommendation.llmUsageId"
            :llm-usage-id="recommendation.llmUsageId"
            size="xs"
          />
        </div>
        <div class="flex gap-1">
          <UTooltip v-if="recommendation.status !== 'COMPLETED'" text="Mark Done">
            <UButton
              color="green"
              variant="ghost"
              size="xs"
              class="group/btn"
              @click="$emit('update-status', recommendation, 'COMPLETED')"
            >
              <template #leading>
                <UIcon name="i-heroicons-check" class="w-5 h-5 group-hover/btn:hidden" />
                <UIcon
                  name="i-heroicons-check-solid"
                  class="w-5 h-5 hidden group-hover/btn:block text-green-600"
                />
              </template>
            </UButton>
          </UTooltip>

          <UTooltip v-if="recommendation.status === 'ACTIVE'" text="Dismiss">
            <UButton
              color="gray"
              variant="ghost"
              size="xs"
              class="group/btn"
              @click="$emit('update-status', recommendation, 'DISMISSED')"
            >
              <template #leading>
                <UIcon name="i-heroicons-eye-slash" class="w-5 h-5 group-hover/btn:hidden" />
                <UIcon
                  name="i-heroicons-eye-slash-solid"
                  class="w-5 h-5 hidden group-hover/btn:block text-gray-600 dark:text-gray-400"
                />
              </template>
            </UButton>
          </UTooltip>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
  const props = defineProps<{
    recommendation: any
  }>()

  const emit = defineEmits(['toggle-pin', 'update-status'])

  const { formatDate } = useFormat()

  const priorityColor = computed(() => {
    switch (props.recommendation.priority) {
      case 'high':
        return 'red'
      case 'medium':
        return 'orange'
      case 'low':
        return 'blue'
      default:
        return 'gray'
    }
  })

  const menuItems = computed(() => [
    [
      {
        label: props.recommendation.status === 'DISMISSED' ? 'Restore' : 'Dismiss',
        icon:
          props.recommendation.status === 'DISMISSED'
            ? 'i-heroicons-arrow-uturn-left'
            : 'i-heroicons-eye-slash',
        click: () =>
          emit(
            'update-status',
            props.recommendation,
            props.recommendation.status === 'DISMISSED' ? 'ACTIVE' : 'DISMISSED'
          )
      },
      {
        label: 'View History',
        icon: 'i-heroicons-clock',
        to: `/recommendations/history?metric=${props.recommendation.metric}&sourceType=${props.recommendation.sourceType}`
      }
    ]
  ])
</script>
