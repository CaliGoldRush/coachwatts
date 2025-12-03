<template>
  <UDashboardPanel id="plan">
    <template #header>
      <UDashboardNavbar title="Training Plan">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Page Header -->
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Training Plan</h1>
          <p class="text-sm text-muted mt-1">
            Set your training availability and let AI create a personalized workout plan
          </p>
        </div>

        <!-- Training Availability Section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Training Availability</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select when you can train during the week
              </p>
            </div>
            <button
              @click="saveAvailability"
              :disabled="savingAvailability"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <span v-if="savingAvailability">Saving...</span>
              <span v-else>Save Availability</span>
            </button>
          </div>

          <div class="space-y-4">
            <div 
              v-for="day in weekDays" 
              :key="day.value"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ day.label }}</h3>
                <span 
                  v-if="hasAnySlot(day.value)" 
                  class="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded"
                >
                  Available
                </span>
              </div>
              
              <div class="grid grid-cols-3 gap-3">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="availability[day.value].morning"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Morning (5am-12pm)</span>
                </label>
                
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="availability[day.value].afternoon"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Afternoon (12pm-6pm)</span>
                </label>
                
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="availability[day.value].evening"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Evening (6pm-11pm)</span>
                </label>
              </div>

              <div class="mt-3 flex items-center space-x-4">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="availability[day.value].gymAccess"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-xs text-gray-600 dark:text-gray-400">Gym Access</span>
                </label>
                
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="availability[day.value].indoorOnly"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-xs text-gray-600 dark:text-gray-400">Indoor Only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Plan Generation Section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Generate Plan</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create an AI-powered training plan based on your availability
              </p>
            </div>
            <button
              @click="generatePlan"
              :disabled="generatingPlan"
              class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <span v-if="generatingPlan">Generating...</span>
              <span v-else>Generate Plan</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Days to Plan
              </label>
              <select
                v-model="planDays"
                class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option :value="1">1 day (tomorrow)</option>
                <option :value="2">2 days</option>
                <option :value="3">3 days</option>
                <option :value="4">4 days</option>
                <option :value="5">5 days</option>
                <option :value="6">6 days</option>
                <option :value="7">7 days (1 week)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Current Plan Display -->
        <div v-if="currentPlan" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Current Training Plan</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ formatDate(currentPlan.weekStartDate) }} - {{ formatDate(currentPlan.weekEndDate) }}
                </p>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {{ currentPlan.totalTSS ? Math.round(currentPlan.totalTSS) : 'N/A' }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Total TSS</div>
              </div>
            </div>
          </div>

          <!-- Plan Summary -->
          <div v-if="currentPlan.planJson?.weekSummary" class="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ currentPlan.planJson.weekSummary }}
            </p>
          </div>

          <!-- Daily Workouts -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Workout
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    TSS
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Intensity
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr 
                  v-for="(day, index) in currentPlan.planJson?.days || []" 
                  :key="index"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  :class="day.workoutType === 'Rest' ? 'opacity-60' : ''"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ formatPlanDate(day.date) }}
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <div class="font-medium text-gray-900 dark:text-white">{{ day.title }}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ day.description }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span :class="getWorkoutTypeBadge(day.workoutType)">
                      {{ day.workoutType }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {{ day.timeOfDay || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {{ day.durationMinutes ? day.durationMinutes + ' min' : '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {{ day.targetTSS ? Math.round(day.targetTSS) : '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span v-if="day.intensity" :class="getIntensityBadge(day.intensity)">
                      {{ formatIntensity(day.intensity) }}
                    </span>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- No Plan Message -->
        <div v-else-if="!loading" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div class="text-gray-400 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Training Plan Yet</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Set your training availability above and generate your first AI-powered training plan
          </p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const loading = ref(false)
const savingAvailability = ref(false)
const generatingPlan = ref(false)
const planDays = ref(7)  // Default to 7 days
const currentPlan = ref<any>(null)

const weekDays = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 }
]

const availability = ref<Record<number, any>>({
  0: { morning: false, afternoon: false, evening: false, gymAccess: false, indoorOnly: false },
  1: { morning: false, afternoon: false, evening: false, gymAccess: false, indoorOnly: false },
  2: { morning: false, afternoon: false, evening: false, gymAccess: false, indoorOnly: false },
  3: { morning: false, afternoon: false, evening: false, gymAccess: false, indoorOnly: false },
  4: { morning: false, afternoon: false, evening: false, gymAccess: false, indoorOnly: false },
  5: { morning: false, afternoon: false, evening: false, gymAccess: false, indoorOnly: false },
  6: { morning: false, afternoon: false, evening: false, gymAccess: false, indoorOnly: false }
})

function hasAnySlot(dayOfWeek: number) {
  const day = availability.value[dayOfWeek]
  return day.morning || day.afternoon || day.evening
}

async function loadAvailability() {
  try {
    const data = await $fetch('/api/availability')
    
    // Populate availability from database
    data.forEach((item: any) => {
      availability.value[item.dayOfWeek] = {
        morning: item.morning,
        afternoon: item.afternoon,
        evening: item.evening,
        gymAccess: item.gymAccess,
        indoorOnly: item.indoorOnly
      }
    })
  } catch (error) {
    console.error('Error loading availability:', error)
  }
}

async function saveAvailability() {
  savingAvailability.value = true
  try {
    const availabilityArray = Object.entries(availability.value).map(([dayOfWeek, data]) => ({
      dayOfWeek: parseInt(dayOfWeek),
      ...data
    }))
    
    await $fetch('/api/availability', {
      method: 'POST',
      body: { availability: availabilityArray }
    })
    
    toast.add({
      title: 'Availability Saved',
      description: 'Your training availability has been updated',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  } catch (error: any) {
    toast.add({
      title: 'Save Failed',
      description: error.data?.message || 'Failed to save availability',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  } finally {
    savingAvailability.value = false
  }
}

async function generatePlan() {
  generatingPlan.value = true
  try {
    const response: any = await $fetch('/api/plans/generate', {
      method: 'POST',
      body: { 
        days: planDays.value,
        startDate: new Date().toISOString()
      }
    })
    
    toast.add({
      title: 'Plan Generation Started',
      description: `Creating your ${planDays.value}-day training plan. Job ID: ${response.jobId?.slice(0, 8)}...`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
    
    // Refresh plan after a delay
    setTimeout(async () => {
      await loadCurrentPlan()
      toast.add({
        title: 'Plan Ready',
        description: 'Your training plan has been generated',
        color: 'success',
        icon: 'i-heroicons-check-badge'
      })
    }, 8000)
  } catch (error: any) {
    toast.add({
      title: 'Generation Failed',
      description: error.data?.message || 'Failed to generate plan',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  } finally {
    generatingPlan.value = false
  }
}

async function loadCurrentPlan() {
  loading.value = true
  try {
    const response: any = await $fetch('/api/plans/current')
    currentPlan.value = response.plan
  } catch (error) {
    console.error('Error loading current plan:', error)
  } finally {
    loading.value = false
  }
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatPlanDate(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function getWorkoutTypeBadge(type: string) {
  const baseClass = 'px-2 py-1 rounded text-xs font-medium'
  const typeMap: Record<string, string> = {
    'Ride': `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`,
    'Run': `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`,
    'Gym': `${baseClass} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`,
    'Swim': `${baseClass} bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200`,
    'Rest': `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`,
    'Active Recovery': `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`
  }
  return typeMap[type] || `${baseClass} bg-gray-100 text-gray-800`
}

function getIntensityBadge(intensity: string) {
  const baseClass = 'px-2 py-1 rounded text-xs font-medium'
  const intensityMap: Record<string, string> = {
    'recovery': `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`,
    'easy': `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`,
    'moderate': `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`,
    'hard': `${baseClass} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`,
    'very_hard': `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
  }
  return intensityMap[intensity] || `${baseClass} bg-gray-100 text-gray-800`
}

function formatIntensity(intensity: string) {
  return intensity.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// Load data on mount
onMounted(async () => {
  await loadAvailability()
  await loadCurrentPlan()
})
</script>