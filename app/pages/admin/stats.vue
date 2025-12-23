<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { data: stats, pending } = await useFetch('/api/admin/stats')

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  }
}

const workoutChartData = computed(() => {
  if (!stats.value?.workoutsByDay) return { labels: [], datasets: [] }
  
  return {
    labels: stats.value.workoutsByDay.map((d: any) => d.date),
    datasets: [{
      label: 'Workouts',
      data: stats.value.workoutsByDay.map((d: any) => d.count),
      backgroundColor: '#3b82f6',
      borderRadius: 4
    }]
  }
})

const aiCostChartData = computed(() => {
  if (!stats.value?.aiCostHistory) return { labels: [], datasets: [] }
  
  return {
    labels: stats.value.aiCostHistory.map((d: any) => d.date),
    datasets: [{
      label: 'Cost ($)',
      data: stats.value.aiCostHistory.map((d: any) => d.cost),
      borderColor: '#10b981',
      backgroundColor: '#10b98133',
      fill: true,
      tension: 0.4
    }]
  }
})
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Application Statistics</h1>
    </div>

    <!-- Body -->
    <div class="p-6 space-y-8">
      <div v-if="pending" class="flex items-center justify-center p-12">
        <UIcon name="i-lucide-loader-2" class="animate-spin h-8 w-8 text-gray-400" />
      </div>

      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <h2 class="text-lg font-bold uppercase tracking-tight">Workouts Per Day</h2>
                <span class="text-xs text-gray-500">Last 30 Days</span>
              </div>
            </template>
            <div class="h-64">
               <!-- Bar chart component placeholder - assuming Bar is available or used like in other pages -->
               <div class="flex items-end justify-between h-full pt-4 gap-1">
                  <div v-for="day in stats?.workoutsByDay" :key="day.date" 
                       class="bg-blue-500 rounded-t w-full transition-all hover:bg-blue-600"
                       :style="{ height: `${(day.count / (Math.max(...stats.workoutsByDay.map((d: any) => d.count)) || 1)) * 100}%` }"
                       :title="`${day.date}: ${day.count} workouts`"
                  ></div>
               </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <h2 class="text-lg font-bold uppercase tracking-tight">AI Cost Trends</h2>
                <span class="text-xs text-gray-500">Last 30 Days</span>
              </div>
            </template>
            <div class="h-64">
              <div class="flex items-end justify-between h-full pt-4 gap-1">
                  <div v-for="day in stats?.aiCostHistory" :key="day.date" 
                       class="bg-emerald-500 rounded-t w-full transition-all hover:bg-emerald-600"
                       :style="{ height: `${(day.cost / (Math.max(...stats.aiCostHistory.map((d: any) => d.cost)) || 0.01)) * 100}%` }"
                       :title="`${day.date}: $${day.cost.toFixed(4)}`"
                  ></div>
               </div>
            </div>
          </UCard>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <UCard class="bg-blue-50/50 dark:bg-blue-900/10">
            <div class="text-center">
              <div class="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Avg Workouts/Day</div>
              <div class="text-2xl font-bold">{{ stats?.avgWorkoutsPerDay?.toFixed(1) || 0 }}</div>
            </div>
          </UCard>
          <UCard class="bg-emerald-50/50 dark:bg-emerald-900/10">
            <div class="text-center">
              <div class="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Avg AI Cost/Call</div>
              <div class="text-2xl font-bold">${{ stats?.avgAiCostPerCall?.toFixed(4) || 0 }}</div>
            </div>
          </UCard>
          <UCard class="bg-purple-50/50 dark:bg-purple-900/10">
            <div class="text-center">
              <div class="text-xs font-bold text-purple-500 uppercase tracking-widest mb-1">Total AI Calls</div>
              <div class="text-2xl font-bold">{{ stats?.totalAiCalls || 0 }}</div>
            </div>
          </UCard>
          <UCard class="bg-amber-50/50 dark:bg-amber-900/10">
            <div class="text-center">
              <div class="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Success Rate</div>
              <div class="text-2xl font-bold">{{ stats?.aiSuccessRate?.toFixed(1) || 0 }}%</div>
            </div>
          </UCard>
        </div>
      </template>
    </div>
  </div>
</template>
