<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading zone data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-sm text-gray-600 dark:text-gray-400">{{ error }}</p>
    </div>

    <!-- No Data State -->
    <div v-else-if="!hasZoneData" class="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <p class="text-sm text-gray-600 dark:text-gray-400">No zone data available</p>
      <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
        {{ !hasStreamData ? 'Stream data not available for this workout' : 'No HR or Power data available' }}
      </p>
    </div>

    <!-- Zone Chart -->
    <div v-else class="space-y-4">
      <!-- Zone Type Selector -->
      <div v-if="hasHrData && hasPowerData" class="flex gap-2">
        <button
          v-for="type in (['hr', 'power'] as const)"
          :key="type"
          @click="selectedZoneType = type as 'hr' | 'power'"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            selectedZoneType === type
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          ]"
        >
          {{ type === 'hr' ? 'Heart Rate Zones' : 'Power Zones' }}
        </button>
      </div>

      <!-- Chart Container -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {{ selectedZoneType === 'hr' ? 'Heart Rate' : 'Power' }} Zone Distribution
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Color-coded timeline showing which zone you were in throughout the workout
          </p>
        </div>

        <!-- Stacked Bar Chart -->
        <div style="height: 200px; position: relative;">
          <Bar :data="chartData" :options="chartOptions" />
        </div>

        <!-- Zone Legend -->
        <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <div
            v-for="(zone, index) in currentZones"
            :key="index"
            class="flex items-center gap-2"
          >
            <div
              class="w-4 h-4 rounded"
              :style="{ backgroundColor: zoneColors[index] }"
            ></div>
            <div class="text-xs">
              <div class="font-medium text-gray-700 dark:text-gray-300">{{ zone.name }}</div>
              <div class="text-gray-500 dark:text-gray-400">
                {{ zone.min }}-{{ zone.max }} {{ selectedZoneType === 'hr' ? 'bpm' : 'W' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Training Distribution Profile -->
        <div v-if="trainingProfile" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Training Distribution Profile</h4>
          </div>
          <div :class="getProfileBadgeClass(trainingProfile.type)" class="p-4 rounded-lg">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                <UIcon :name="getProfileIcon(trainingProfile.type)" class="w-8 h-8" />
              </div>
              <div class="flex-1">
                <h5 class="font-bold text-lg mb-1">{{ trainingProfile.type }}</h5>
                <p class="text-sm opacity-90">{{ trainingProfile.description }}</p>
                <div class="mt-2 text-xs opacity-75">
                  <span class="font-medium">Zone Distribution:</span> {{ trainingProfile.distribution }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Time in Zone Summary -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time in Zone</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            <div
              v-for="(zone, index) in currentZones"
              :key="index"
              class="text-center p-2 rounded"
              :style="{ backgroundColor: zoneColors[index] + '20', borderLeft: `3px solid ${zoneColors[index]}` }"
            >
              <div class="text-xs text-gray-600 dark:text-gray-400">{{ zone.name.split(' ')[0] }}</div>
              <div class="text-lg font-bold" :style="{ color: zoneColors[index] }">
                {{ formatDuration(timeInZones[index] || 0) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ totalTime > 0 ? ((timeInZones[index] || 0) / totalTime * 100).toFixed(0) : 0 }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Props {
  workoutId: string
  publicToken?: string
}

const props = defineProps<Props>()

const loading = ref(true)
const error = ref<string | null>(null)
const streamData = ref<any>(null)
const userZones = ref<any>(null)
const selectedZoneType = ref<'hr' | 'power'>('hr')

// Default zone colors (from Z1 to Z5+)
const zoneColors = [
  'rgb(34, 197, 94)',    // Z1 - Green (Recovery)
  'rgb(59, 130, 246)',   // Z2 - Blue (Endurance)
  'rgb(245, 158, 11)',   // Z3 - Yellow (Tempo)
  'rgb(249, 115, 22)',   // Z4 - Orange (Threshold)
  'rgb(239, 68, 68)',    // Z5 - Red (Anaerobic/VO2 Max)
]

// Computed properties
const hasStreamData = computed(() => {
  return !!(streamData.value && (streamData.value.heartrate || streamData.value.watts || streamData.value.hrZoneTimes || streamData.value.powerZoneTimes))
})

const hasHrData = computed(() => {
  return !!(streamData.value?.heartrate?.length > 0 || streamData.value?.hrZoneTimes?.length > 0)
})

const hasPowerData = computed(() => {
  return !!(streamData.value?.watts?.length > 0 || streamData.value?.powerZoneTimes?.length > 0)
})

const hasZoneData = computed(() => {
  return hasStreamData.value && currentZones.value && currentZones.value.length > 0
})

const currentZones = computed(() => {
  if (!userZones.value) return []
  return selectedZoneType.value === 'hr' ? userZones.value.hrZones : userZones.value.powerZones
})

const timeInZones = ref<number[]>([])
const totalTime = ref(0)

// Watch for data changes to update timeInZones if cached data is present
watch([streamData, selectedZoneType], () => {
  if (!streamData.value) return
  
  if (selectedZoneType.value === 'hr' && streamData.value.hrZoneTimes?.length > 0) {
    timeInZones.value = streamData.value.hrZoneTimes
    totalTime.value = timeInZones.value.reduce((a, b) => a + b, 0)
  } else if (selectedZoneType.value === 'power' && streamData.value.powerZoneTimes?.length > 0) {
    timeInZones.value = streamData.value.powerZoneTimes
    totalTime.value = timeInZones.value.reduce((a, b) => a + b, 0)
  }
}, { immediate: true })

// Training distribution profile
interface TrainingProfile {
  type: 'Polarized' | 'Pyramidal' | 'Threshold' | 'HIIT' | 'Base' | 'Mixed'
  description: string
  distribution: string
  confidence: number
}

const trainingProfile = computed<TrainingProfile | null>(() => {
  if (timeInZones.value.length < 5 || totalTime.value === 0) return null
  
  // Calculate percentages for each zone
  const percentages = timeInZones.value.map(time => (time / totalTime.value) * 100)
  
  // Categorize zones into groups (with null checks)
  const z1z2 = (percentages[0] || 0) + (percentages[1] || 0) // Easy/Endurance (Z1+Z2)
  const z3 = percentages[2] || 0 // Tempo (Z3)
  const z4z5 = (percentages[3] || 0) + (percentages[4] || 0) // Threshold/VO2 Max (Z4+Z5)
  
  // Detection logic with confidence scoring
  let profile: TrainingProfile
  
  // HIIT: >30% in Z4-Z5, minimal Z1-Z2
  if (z4z5 > 30 && z1z2 < 50) {
    profile = {
      type: 'HIIT',
      description: 'High-intensity interval training with significant time at maximum effort',
      distribution: `${z4z5.toFixed(0)}% high intensity, ${z3.toFixed(0)}% tempo, ${z1z2.toFixed(0)}% easy`,
      confidence: Math.min(100, z4z5 * 2)
    }
  }
  // Threshold: >40% in Z3-Z4
  else if ((z3 + (percentages[3] || 0)) > 40) {
    profile = {
      type: 'Threshold',
      description: 'Sustained effort at or near lactate threshold, building race-pace endurance',
      distribution: `${(z3 + (percentages[3] || 0)).toFixed(0)}% tempo/threshold, ${z1z2.toFixed(0)}% easy, ${(percentages[4] || 0).toFixed(0)}% hard`,
      confidence: Math.min(100, (z3 + (percentages[3] || 0)) * 1.5)
    }
  }
  // Polarized: >70% in Z1-Z2 and >15% in Z4-Z5, <15% in Z3
  else if (z1z2 > 70 && z4z5 > 15 && z3 < 15) {
    profile = {
      type: 'Polarized',
      description: 'Optimal training distribution: easy base work with intense intervals, avoiding moderate zones',
      distribution: `${z1z2.toFixed(0)}% easy, ${z3.toFixed(0)}% tempo, ${z4z5.toFixed(0)}% hard`,
      confidence: Math.min(100, (z1z2 + z4z5) / 2)
    }
  }
  // Base: >80% in Z1-Z2
  else if (z1z2 > 80) {
    profile = {
      type: 'Base',
      description: 'Aerobic base building with easy, sustainable effort for endurance development',
      distribution: `${z1z2.toFixed(0)}% easy aerobic, ${z3.toFixed(0)}% tempo, ${z4z5.toFixed(0)}% hard`,
      confidence: Math.min(100, z1z2)
    }
  }
  // Pyramidal: Progressive decrease from Z2 to Z5
  else if ((percentages[1] || 0) > (percentages[2] || 0) && (percentages[2] || 0) > (percentages[3] || 0)) {
    profile = {
      type: 'Pyramidal',
      description: 'Traditional volume-based training with most time at moderate intensity, tapering to high intensity',
      distribution: `${z1z2.toFixed(0)}% easy, ${z3.toFixed(0)}% tempo, ${z4z5.toFixed(0)}% hard`,
      confidence: 70
    }
  }
  // Mixed: Doesn't fit clear pattern
  else {
    profile = {
      type: 'Mixed',
      description: 'Varied intensity distribution across multiple zones, typical of group rides or races',
      distribution: `${z1z2.toFixed(0)}% easy, ${z3.toFixed(0)}% tempo, ${z4z5.toFixed(0)}% hard`,
      confidence: 60
    }
  }
  
  return profile
})

// Calculate zone distribution for chart
const chartData = computed(() => {
  if (!hasZoneData.value || !streamData.value) {
    return { labels: [], datasets: [] }
  }

  const time = streamData.value.time || []
  const values = selectedZoneType.value === 'hr' ? streamData.value.heartrate : streamData.value.watts
  const cachedZones = selectedZoneType.value === 'hr' ? streamData.value.hrZoneTimes : streamData.value.powerZoneTimes

  // If we have cached zones but no raw values, we still want to show the profile and summary
  // but the timeline chart (Bar) needs data. If we don't have raw values, we can't show the timeline.
  if (!values || values.length === 0) {
    return { labels: [], datasets: [] }
  }

  // Sample data for performance (every 30 seconds or every 30th point)
  const sampleRate = Math.max(1, Math.floor(values.length / 200))
  const sampledTime = time.filter((_: any, i: number) => i % sampleRate === 0)
  const sampledValues = values.filter((_: any, i: number) => i % sampleRate === 0)

  // Calculate which zone each point belongs to
  const zoneData = currentZones.value.map(() => new Array(sampledTime.length).fill(0))
  const timeInZonesCalc = new Array(currentZones.value.length).fill(0)
  
  sampledValues.forEach((value: number, i: number) => {
    const zoneIndex = getZoneIndex(value)
    if (zoneIndex >= 0) {
      zoneData[zoneIndex][i] = 1 // Mark this zone as active at this time
      // Calculate time in zone (approximate from sample rate)
      if (i > 0) {
        const timeDiff = sampledTime[i] - sampledTime[i - 1]
        timeInZonesCalc[zoneIndex] += timeDiff
      }
    }
  })

  timeInZones.value = timeInZonesCalc
  totalTime.value = sampledTime[sampledTime.length - 1] - sampledTime[0]

  return {
    labels: sampledTime.map((t: number) => formatTime(t)),
    datasets: currentZones.value.map((zone: any, index: number) => ({
      label: zone.name,
      data: zoneData[index],
      backgroundColor: zoneColors[index],
      borderWidth: 0,
      barThickness: 'flex',
      maxBarThickness: 10
    }))
  }
})

const chartOptions = computed(() => {
  const isDark = document.documentElement.classList.contains('dark')
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            return `Time: ${context[0].label}`
          },
          label: (context: any) => {
            if (context.parsed.y === 1) {
              return context.dataset.label
            }
            return null
          },
          footer: (contexts: any) => {
            const activeZones = contexts.filter((c: any) => c.parsed.y === 1)
            if (activeZones.length > 0) {
              const zone = currentZones.value[activeZones[0].datasetIndex]
              return `${zone.min}-${zone.max} ${selectedZoneType.value === 'hr' ? 'bpm' : 'W'}`
            }
            return ''
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: isDark ? '#9CA3AF' : '#6B7280',
          maxRotation: 0,
          autoSkipPadding: 50,
          font: {
            size: 10
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        stacked: true,
        display: false,
        max: 1
      }
    },
    layout: {
      padding: {
        left: 5,
        right: 5,
        top: 5,
        bottom: 5
      }
    }
  }
})

// Helper functions
function getZoneIndex(value: number): number {
  if (!currentZones.value) return -1
  
  for (let i = 0; i < currentZones.value.length; i++) {
    const zone = currentZones.value[i]
    if (value >= zone.min && value <= zone.max) {
      return i
    }
  }
  
  // If value is above all zones, put it in the highest zone
  if (value > currentZones.value[currentZones.value.length - 1].max) {
    return currentZones.value.length - 1
  }
  
  return -1
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}`
  }
  return `${minutes}min`
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

// Fetch data
async function fetchData() {
  loading.value = true
  error.value = null
  
  try {
    if (props.publicToken) {
      // Public mode: Fetch everything from share endpoint
      const workout = await $fetch(`/api/share/workouts/${props.publicToken}`) as any
      // We need streams separately as the main endpoint returns summarized workout data
      // Actually, we need a new endpoint for streams in public mode
      const streams = await $fetch(`/api/share/workouts/${props.publicToken}/streams`)
      
      streamData.value = streams
      // Extract zones from the user object nested in the workout (needs backend support)
      userZones.value = {
        hrZones: workout.user?.hrZones || getDefaultHrZones(),
        powerZones: workout.user?.powerZones || getDefaultPowerZones()
      }
    } else {
      // Private/Auth mode
      const [streams, profile] = await Promise.all([
        $fetch(`/api/workouts/${props.workoutId}/streams`),
        $fetch('/api/profile')
      ])
      
      streamData.value = streams
      userZones.value = {
        hrZones: profile.profile?.hrZones || getDefaultHrZones(),
        powerZones: profile.profile?.powerZones || getDefaultPowerZones()
      }
    }
    
    // Auto-select zone type based on available data
    if (hasHrData.value) {
      selectedZoneType.value = 'hr'
    } else if (hasPowerData.value) {
      selectedZoneType.value = 'power'
    }
  } catch (e: any) {
    console.error('Error fetching zone data:', e)
    error.value = e.data?.message || 'Failed to load zone data'
  } finally {
    loading.value = false
  }
}

function getDefaultHrZones() {
  return [
    { name: 'Z1 Recovery', min: 60, max: 120 },
    { name: 'Z2 Endurance', min: 121, max: 145 },
    { name: 'Z3 Tempo', min: 146, max: 160 },
    { name: 'Z4 Threshold', min: 161, max: 175 },
    { name: 'Z5 Anaerobic', min: 176, max: 220 }
  ]
}

function getDefaultPowerZones() {
  return [
    { name: 'Z1 Active Recovery', min: 0, max: 137 },
    { name: 'Z2 Endurance', min: 138, max: 187 },
    { name: 'Z3 Tempo', min: 188, max: 225 },
    { name: 'Z4 Threshold', min: 226, max: 262 },
    { name: 'Z5 VO2 Max', min: 263, max: 999 }
  ]
}

function getProfileBadgeClass(type: string): string {
  const base = 'border-2'
  switch (type) {
    case 'Polarized':
      return `${base} bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100`
    case 'Pyramidal':
      return `${base} bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100`
    case 'Threshold':
      return `${base} bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100`
    case 'HIIT':
      return `${base} bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100`
    case 'Base':
      return `${base} bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100`
    default:
      return `${base} bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100`
  }
}

function getProfileIcon(type: string): string {
  switch (type) {
    case 'Polarized':
      return 'i-heroicons-arrows-up-down'
    case 'Pyramidal':
      return 'i-heroicons-chart-bar'
    case 'Threshold':
      return 'i-heroicons-bolt'
    case 'HIIT':
      return 'i-heroicons-fire'
    case 'Base':
      return 'i-heroicons-heart'
    default:
      return 'i-heroicons-squares-2x2'
  }
}

// Load data on mount
onMounted(() => {
  fetchData()
})
</script>