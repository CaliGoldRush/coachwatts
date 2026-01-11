<script setup lang="ts">
  definePageMeta({
    layout: 'admin',
    middleware: ['auth', 'admin']
  })

  const { data: stats } = await useFetch('/api/admin/stats')

  useHead({
    title: 'Admin Dashboard',
    meta: [{ name: 'description', content: 'Coach Watts system administration and overview.' }]
  })

  // Helper to normalize bar heights
  function getBarHeight(val: number, max: number) {
    if (!max || max === 0) return '2px'
    const pct = (val / max) * 100
    // Ensure at least a visible pixel
    return Math.max(pct, 2) + '%'
  }

  // Computed max values for scaling
  const maxUsers = computed(() => {
    if (!stats.value?.usersByDay) return 0
    return Math.max(...stats.value.usersByDay.map((d: any) => d.count))
  })

  const maxWorkouts = computed(() => {
    if (!stats.value?.workoutsByDay) return 0
    return Math.max(...stats.value.workoutsByDay.map((d: any) => d.count))
  })

  const maxAiCost = computed(() => {
    if (!stats.value?.aiCostHistory) return 0
    return Math.max(...stats.value.aiCostHistory.map((d: any) => d.cost))
  })
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
    </div>

    <!-- Body -->
    <div class="p-6 space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NuxtLink to="/admin/stats/users" class="block">
          <UCard
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative overflow-hidden group"
          >
            <template #header>
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Users</h3>
            </template>
            <p class="text-3xl font-bold text-gray-900 dark:text-white relative z-10">
              {{ stats?.totalUsers || 0 }}
            </p>
            <!-- Chart -->
            <div
              v-if="stats?.usersByDay"
              class="absolute bottom-0 left-0 right-0 h-12 flex items-end justify-between px-1 gap-0.5 opacity-20 group-hover:opacity-40 transition-opacity"
            >
              <div
                v-for="(day, idx) in stats.usersByDay"
                :key="idx"
                class="flex-1 bg-blue-500 rounded-t-sm transition-all duration-300"
                :style="{ height: getBarHeight(day.count, maxUsers) }"
                :title="`${day.date}: ${day.count} users`"
              />
            </div>
          </UCard>
        </NuxtLink>

        <NuxtLink to="/admin/stats/workouts" class="block">
          <UCard
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative overflow-hidden group"
          >
            <template #header>
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Total Workouts
              </h3>
            </template>
            <p class="text-3xl font-bold text-gray-900 dark:text-white relative z-10">
              {{ stats?.totalWorkouts || 0 }}
            </p>
            <!-- Chart -->
            <div
              v-if="stats?.workoutsByDay"
              class="absolute bottom-0 left-0 right-0 h-12 flex items-end justify-between px-1 gap-0.5 opacity-20 group-hover:opacity-40 transition-opacity"
            >
              <div
                v-for="(day, idx) in stats.workoutsByDay"
                :key="idx"
                class="flex-1 bg-green-500 rounded-t-sm transition-all duration-300"
                :style="{ height: getBarHeight(day.count, maxWorkouts) }"
                :title="`${day.date}: ${day.count} workouts`"
              />
            </div>
          </UCard>
        </NuxtLink>

        <NuxtLink to="/admin/stats/llm" class="block">
          <UCard
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative overflow-hidden group"
          >
            <template #header>
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest">
                AI Cost (MTD)
              </h3>
            </template>
            <p class="text-3xl font-bold text-gray-900 dark:text-white relative z-10">
              ${{ stats?.totalAiCost?.toFixed(2) || '0.00' }}
            </p>
            <!-- Chart -->
            <div
              v-if="stats?.aiCostHistory"
              class="absolute bottom-0 left-0 right-0 h-12 flex items-end justify-between px-1 gap-0.5 opacity-20 group-hover:opacity-40 transition-opacity"
            >
              <div
                v-for="(day, idx) in stats.aiCostHistory"
                :key="idx"
                class="flex-1 bg-purple-500 rounded-t-sm transition-all duration-300"
                :style="{ height: getBarHeight(day.cost, maxAiCost) }"
                :title="`${day.date}: $${day.cost.toFixed(4)}`"
              />
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UCard>
          <template #header>
            <h2 class="text-xl font-bold uppercase tracking-tight">Recent Activity</h2>
          </template>
          <!-- Placeholder for activity list -->
          <div class="text-sm text-gray-500 italic">
            Recent system-wide events will appear here...
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-xl font-bold uppercase tracking-tight">System Status</h2>
          </template>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-sm">Database</span>
              <span
                class="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >Online</span
              >
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">Trigger.dev</span>
              <span
                class="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >Connected</span
              >
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
