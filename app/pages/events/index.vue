<template>
  <UDashboardPanel id="events">
    <template #header>
      <UDashboardNavbar title="Events">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex gap-3">
            <UButton
              @click="isEventFormOpen = true"
              color="primary"
              variant="solid"
              icon="i-heroicons-plus"
              size="sm"
              class="font-bold"
            >
              Add Event
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-8">
        <!-- Page Header -->
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Events Management</h1>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Plan your races, events, and training milestones
          </p>
        </div>

        <!-- Events List -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white uppercase tracking-tight">Racing Events</h2>
          </div>
          
          <div v-if="loading" class="p-8 text-center text-gray-600 dark:text-gray-400">
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin mx-auto mb-2" />
            Loading events...
          </div>
          
          <div v-else-if="events.length === 0" class="p-8 text-center text-gray-600 dark:text-gray-400">
            <UIcon name="i-lucide-flag" class="size-12 mx-auto mb-4 opacity-20" />
            <p>No events found. Add your first race or event to get started.</p>
            <UButton
              class="mt-4 font-bold"
              color="primary"
              variant="outline"
              size="sm"
              icon="i-heroicons-plus"
              @click="isEventFormOpen = true"
            >
              Add Event
            </UButton>
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Priority</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profile</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Goals</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="event in events"
                  :key="event.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-gray-900 dark:text-white">{{ event.name }}</span>
                      <span v-if="event.websiteUrl" class="text-xs text-blue-500 hover:underline">
                        <a :href="event.websiteUrl" target="_blank">{{ event.websiteUrl }}</a>
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <div class="flex flex-col">
                      <span>{{ formatDate(event.date) }}</span>
                      <span v-if="event.startTime" class="text-xs font-medium text-gray-500">{{ event.startTime }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <div class="flex flex-col">
                      <span>{{ event.type }}</span>
                      <span v-if="event.subType" class="text-xs text-muted">{{ event.subType }}</span>
                    </div>
                    <span v-if="event.isVirtual" class="mt-1 inline-block text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1 rounded uppercase font-bold w-fit">Virtual</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span :class="getPriorityBadgeClass(event.priority)">
                      {{ event.priority }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <div class="flex flex-col gap-0.5">
                      <span v-if="event.distance" class="font-medium text-gray-900 dark:text-white">{{ event.distance }} km</span>
                      <span v-if="event.elevation" class="text-xs">{{ event.elevation }} m elev.</span>
                      <span v-if="event.expectedDuration" class="text-xs">{{ event.expectedDuration }} h</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {{ formatLocation(event) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex flex-wrap gap-1">
                      <span v-for="goalLink in event.goals" :key="goalLink.goalId" class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 font-medium">
                        {{ goalLink.goal.title }}
                      </span>
                      <span v-if="!event.goals || event.goals.length === 0" class="text-xs text-gray-400 italic">No goals linked</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Event Form Modal -->
      <UModal v-model:open="isEventFormOpen" title="Add New Event" description="Create a new race or event record.">
        <template #body>
          <EventForm @success="onEventCreated" @cancel="isEventFormOpen = false" />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import EventForm from '~/components/events/EventForm.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

useHead({
  title: 'Events Management',
  meta: [
    { name: 'description', content: 'Manage your racing calendar and training milestones.' }
  ]
})

const loading = ref(true)
const events = ref<any[]>([])
const isEventFormOpen = ref(false)

async function fetchEvents() {
  loading.value = true
  try {
    const data = await $fetch('/api/events')
    events.value = data
  } catch (error) {
    console.error('Error fetching events:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to load events',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function onEventCreated() {
  isEventFormOpen.value = false
  fetchEvents()
  useToast().add({
    title: 'Success',
    description: 'Event created successfully',
    color: 'success'
  })
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getPriorityBadgeClass(priority: string) {
  const baseClass = 'px-3 py-1 rounded-full text-xs font-bold'
  switch (priority) {
    case 'A':
      return `${baseClass} bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 ring-1 ring-amber-500/20`
    case 'B':
      return `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ring-1 ring-blue-500/20`
    case 'C':
      return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 ring-1 ring-gray-500/20`
    default:
      return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
  }
}

function formatLocation(event: any) {
  const parts = []
  if (event.city) parts.push(event.city)
  if (event.country) parts.push(event.country)
  if (parts.length === 0 && event.location) return event.location
  return parts.join(', ')
}

onMounted(() => {
  fetchEvents()
})
</script>
