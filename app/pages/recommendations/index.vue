<template>
  <UDashboardPanel id="recommendations">
    <template #header>
      <UDashboardNavbar title="Coach Recommendations">
        <template #right>
          <div class="flex items-center gap-3">
            <UButton
              icon="i-heroicons-sparkles"
              color="primary"
              variant="solid"
              :loading="generating"
              @click="generateNew"
            >
              Analyze & Improve
            </UButton>
            <UButton
              icon="i-heroicons-arrow-path"
              color="gray"
              variant="ghost"
              @click="refreshAll"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-8">
        <!-- Pinned / Focus Section -->
        <section v-if="pinnedRecs?.length > 0">
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-heroicons-paper-clip" class="w-5 h-5 text-primary-500" />
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Focus Area</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RecommendationCard
              v-for="rec in pinnedRecs"
              :key="rec.id"
              :recommendation="rec"
              @toggle-pin="togglePin"
              @update-status="updateStatus"
            />
          </div>
        </section>

        <!-- Main Content Tabs -->
        <UTabs :items="tabs" class="w-full">
          <template #active>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-if="activePending" class="col-span-full py-8 flex justify-center">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
              </div>
              <template v-else>
                <div
                  v-if="activeRecs?.length === 0"
                  class="col-span-full py-8 text-center text-gray-500"
                >
                  No active recommendations. You're doing great!
                </div>
                <RecommendationCard
                  v-for="rec in activeRecs"
                  :key="rec.id"
                  :recommendation="rec"
                  @toggle-pin="togglePin"
                  @update-status="updateStatus"
                />
              </template>
            </div>
          </template>

          <template #history>
            <div class="mt-4 space-y-4">
              <div v-if="historyPending" class="py-8 flex justify-center">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
              </div>
              <template v-else>
                <div v-if="historyRecs?.length === 0" class="py-8 text-center text-gray-500">
                  No history found.
                </div>
                <RecommendationCard
                  v-for="rec in historyRecs"
                  :key="rec.id"
                  :recommendation="rec"
                  @toggle-pin="togglePin"
                  @update-status="updateStatus"
                />
              </template>
            </div>
          </template>
        </UTabs>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
  import RecommendationCard from '~/components/recommendations/RecommendationCard.vue'

  definePageMeta({
    middleware: 'auth',
    layout: 'default'
  })

  const toast = useToast()

  const generating = ref(false)

  async function generateNew() {
    generating.value = true
    try {
      await $fetch('/api/scores/generate-explanations', {
        method: 'POST'
      })

      toast.add({
        title: 'Analysis Started',
        description: 'AI is analyzing your trends. New recommendations will appear shortly.',
        color: 'success',
        icon: 'i-heroicons-sparkles'
      })

      // Auto refresh after 10 seconds (gives job time to finish at least one metric)
      setTimeout(() => {
        refreshAll()
        generating.value = false
      }, 10000)
    } catch (error: any) {
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to start analysis',
        color: 'error'
      })
      generating.value = false
    }
  }

  const tabs = [
    { label: 'Current Advice', slot: 'active' },
    { label: 'History', slot: 'history' }
  ]

  // Fetch Pinned (Always visible at top)
  // Only active pinned ones are shown here.
  const { data: pinnedRecs, refresh: refreshPinned } = await useFetch('/api/recommendations', {
    query: { isPinned: true, status: 'ACTIVE' }, // Only active pinned ones? Or all pinned? Let's say ACTIVE pinned.
    key: 'pinned-recs'
  })

  // Fetch Active (Unpinned)
  const {
    data: activeRecs,
    pending: activePending,
    refresh: refreshActive
  } = await useFetch('/api/recommendations', {
    query: { status: 'ACTIVE', isPinned: false },
    key: 'active-recs'
  })

  // Fetch History (Completed/Dismissed)
  const {
    data: allHistory,
    pending: historyPending,
    refresh: refreshHistory
  } = await useFetch('/api/recommendations', {
    query: { status: 'ALL' },
    lazy: true,
    key: 'history-recs'
  })

  const historyRecs = computed(() => {
    return allHistory.value?.filter((r: any) => r.status !== 'ACTIVE') || []
  })

  async function refreshAll() {
    await Promise.all([refreshPinned(), refreshActive(), refreshHistory()])
  }

  async function togglePin(rec: any) {
    const newPinnedState = !rec.isPinned

    // Optimistic update
    // Remove from source list, add to target list
    // This is complex with reactive arrays.
    // Let's just call API and refresh for MVP reliability.

    try {
      await $fetch(`/api/recommendations/${rec.id}`, {
        method: 'PATCH',
        body: { isPinned: newPinnedState }
      })

      toast.add({ title: newPinnedState ? 'Pinned to Focus' : 'Unpinned', color: 'success' })
      refreshAll()
    } catch (e) {
      toast.add({ title: 'Error updating', color: 'error' })
    }
  }

  async function updateStatus(rec: any, status: string) {
    try {
      await $fetch(`/api/recommendations/${rec.id}`, {
        method: 'PATCH',
        body: { status }
      })

      const action = status === 'COMPLETED' ? 'Marked as Done' : 'Dismissed'
      toast.add({ title: action, color: 'success' })
      refreshAll()
    } catch (e) {
      toast.add({ title: 'Error updating status', color: 'error' })
    }
  }
</script>
