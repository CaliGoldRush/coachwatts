<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
    <h3 class="font-semibold text-sm text-gray-500 dark:text-gray-400 mb-4">Weekly Zone Distribution</h3>
    
    <div v-if="hasData" class="space-y-3">
      <!-- Chart -->
      <div class="flex h-32 items-end gap-2 px-2">
        <div 
          v-for="(zone, index) in zones" 
          :key="index"
          class="flex-1 flex flex-col items-center group"
        >
          <div 
            class="w-full rounded-t transition-all relative"
            :class="zone.color"
            :style="{ height: `${(zone.duration / maxDuration) * 100}%` }"
          >
            <!-- Tooltip -->
            <div class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {{ formatDuration(zone.duration) }} ({{ Math.round((zone.duration / totalDuration) * 100) }}%)
            </div>
          </div>
          <div class="text-xs font-bold mt-1 text-gray-600 dark:text-gray-400">{{ zone.name }}</div>
        </div>
      </div>
      
      <!-- Legend/Stats -->
      <div class="grid grid-cols-3 gap-2 mt-4 text-xs">
        <div v-for="zone in zones" :key="zone.name" class="flex justify-between p-1 bg-gray-50 dark:bg-gray-900 rounded">
          <span class="font-medium text-gray-500">{{ zone.name }}</span>
          <span class="font-bold">{{ formatDuration(zone.duration) }}</span>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center py-8 text-sm text-muted">
      Generate structured workouts to see zone distribution.
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  workouts: any[]
}>()

const hasData = computed(() => props.workouts?.some(w => w.structuredWorkout))

const zones = computed(() => {
  const distribution = [
    { name: 'Z1', min: 0, max: 0.55, duration: 0, color: 'bg-gray-400' },
    { name: 'Z2', min: 0.55, max: 0.75, duration: 0, color: 'bg-blue-500' },
    { name: 'Z3', min: 0.75, max: 0.90, duration: 0, color: 'bg-green-500' },
    { name: 'Z4', min: 0.90, max: 1.05, duration: 0, color: 'bg-yellow-500' },
    { name: 'Z5', min: 1.05, max: 1.20, duration: 0, color: 'bg-orange-500' },
    { name: 'Z6', min: 1.20, max: 9.99, duration: 0, color: 'bg-red-500' },
  ]

  if (!props.workouts) return distribution

  props.workouts.forEach(w => {
    if (w.structuredWorkout?.steps) {
      w.structuredWorkout.steps.forEach((step: any) => {
        const power = step.power?.value || 0
        const duration = step.durationSeconds || 0
        
        // Find zone
        const zone = distribution.find(z => power <= z.max) || distribution[distribution.length - 1]
        zone.duration += duration
      })
    } else if (w.durationSec && w.workIntensity) {
      // Approximate for unstructured workouts based on intensity?
      // Maybe unsafe. Let's stick to structured.
    }
  })

  return distribution
})

const maxDuration = computed(() => Math.max(...zones.value.map(z => z.duration), 1)) // Avoid div by zero
const totalDuration = computed(() => zones.value.reduce((acc, z) => acc + z.duration, 0))

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
</script>
