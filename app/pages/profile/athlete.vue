<template>
  <UDashboardPanel id="athlete-profile">
    <template #header>
      <UDashboardNavbar title="Athlete Profile">
        <template #leading>
          <UButton
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            to="/dashboard"
          >
            Back to Dashboard
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-4xl mx-auto">
        <div v-if="pending" class="flex justify-center py-20">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
        </div>
        
        <div v-else-if="profile">
          <!-- Header -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-3xl font-bold">{{ profile.analysisJson?.title || 'Rider Profile' }}</h2>
                <p class="text-gray-600 dark:text-gray-400 mt-2">
                  Generated: {{ formatDate(profile.createdAt) }}
                </p>
              </div>
              <UBadge :color="statusColor as any" size="lg">
                {{ profile.status }}
              </UBadge>
            </div>
          </div>
          
          <!-- Status Alert -->
          <UAlert
            v-if="profile.status === 'PROCESSING'"
            color="info"
            icon="i-heroicons-arrow-path"
            title="Generating Profile"
            description="Analyzing your training data to create a comprehensive rider profile. This may take a few moments..."
            class="mb-6"
          />
          
          <UAlert
            v-else-if="profile.status === 'FAILED'"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            title="Profile Generation Failed"
            description="Unable to generate profile. Please try again."
            class="mb-6"
          />
          
          <!-- Content - Structured Profile Display -->
          <div v-if="profile.status === 'COMPLETED' && profile.analysisJson" class="space-y-6">
            <!-- Executive Summary -->
            <UCard>
              <template #header>
                <h3 class="text-xl font-semibold flex items-center gap-2">
                  <UIcon name="i-heroicons-user-circle" class="w-6 h-6" />
                  Profile Overview
                </h3>
              </template>
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                {{ profile.analysisJson.executive_summary }}
              </p>
            </UCard>

            <!-- Current Fitness -->
            <UCard v-if="profile.analysisJson.current_fitness">
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-semibold flex items-center gap-2">
                    <UIcon name="i-heroicons-bolt" class="w-6 h-6" />
                    Current Fitness
                  </h3>
                  <UBadge :color="getStatusBadgeColor(profile.analysisJson.current_fitness.status) as any" size="lg">
                    {{ profile.analysisJson.current_fitness.status_label }}
                  </UBadge>
                </div>
              </template>
              
              <div class="space-y-3">
                <div v-for="(point, idx) in profile.analysisJson.current_fitness.key_points" :key="idx" class="flex gap-3">
                  <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p class="text-gray-700 dark:text-gray-300">{{ point }}</p>
                </div>
              </div>
            </UCard>

            <!-- Training Characteristics -->
            <UCard v-if="profile.analysisJson.training_characteristics">
              <template #header>
                <h3 class="text-xl font-semibold flex items-center gap-2">
                  <UIcon name="i-heroicons-academic-cap" class="w-6 h-6" />
                  Training Characteristics
                </h3>
              </template>
              
              <div class="space-y-4">
                <div>
                  <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {{ profile.analysisJson.training_characteristics.training_style }}
                  </p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 class="font-semibold text-green-900 dark:text-green-200 mb-2 flex items-center gap-2">
                      <UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
                      Strengths
                    </h4>
                    <ul class="space-y-1">
                      <li v-for="strength in profile.analysisJson.training_characteristics.strengths" :key="strength" class="text-sm text-green-800 dark:text-green-300">
                        • {{ strength }}
                      </li>
                    </ul>
                  </div>
                  
                  <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 class="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                      <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5" />
                      Areas for Development
                    </h4>
                    <ul class="space-y-1">
                      <li v-for="area in profile.analysisJson.training_characteristics.areas_for_development" :key="area" class="text-sm text-blue-800 dark:text-blue-300">
                        • {{ area }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Recovery Profile -->
            <UCard v-if="profile.analysisJson.recovery_profile">
              <template #header>
                <h3 class="text-xl font-semibold flex items-center gap-2">
                  <UIcon name="i-heroicons-heart" class="w-6 h-6" />
                  Recovery Profile
                </h3>
              </template>
              
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-if="profile.analysisJson.recovery_profile.recovery_pattern">
                    <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Recovery Pattern</h4>
                    <p class="text-gray-800 dark:text-gray-200">{{ profile.analysisJson.recovery_profile.recovery_pattern }}</p>
                  </div>
                  
                  <div v-if="profile.analysisJson.recovery_profile.hrv_trend">
                    <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">HRV Trend</h4>
                    <p class="text-gray-800 dark:text-gray-200">{{ profile.analysisJson.recovery_profile.hrv_trend }}</p>
                  </div>
                  
                  <div v-if="profile.analysisJson.recovery_profile.sleep_quality" class="md:col-span-2">
                    <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Sleep Quality</h4>
                    <p class="text-gray-800 dark:text-gray-200">{{ profile.analysisJson.recovery_profile.sleep_quality }}</p>
                  </div>
                </div>
                
                <div class="pt-3 border-t">
                  <h4 class="font-medium mb-2">Key Observations:</h4>
                  <div class="space-y-2">
                    <div v-for="(obs, idx) in profile.analysisJson.recovery_profile.key_observations" :key="idx" class="flex gap-3">
                      <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <p class="text-gray-700 dark:text-gray-300">{{ obs }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Recent Performance -->
            <UCard v-if="profile.analysisJson.recent_performance">
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-semibold flex items-center gap-2">
                    <UIcon name="i-heroicons-chart-bar" class="w-6 h-6" />
                    Recent Performance
                  </h3>
                  <UBadge :color="getTrendBadgeColor(profile.analysisJson.recent_performance.trend) as any" size="lg">
                    {{ formatTrend(profile.analysisJson.recent_performance.trend) }}
                  </UBadge>
                </div>
              </template>
              
              <div class="space-y-4">
                <div v-if="profile.analysisJson.recent_performance.notable_workouts?.length" class="space-y-3">
                  <h4 class="font-medium">Notable Workouts:</h4>
                  <div v-for="workout in profile.analysisJson.recent_performance.notable_workouts" :key="workout.date" class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div class="flex justify-between items-start mb-1">
                      <span class="font-medium">{{ workout.title }}</span>
                      <span class="text-sm text-gray-600 dark:text-gray-400">{{ formatShortDate(workout.date) }}</span>
                    </div>
                    <p class="text-sm text-gray-700 dark:text-gray-300">{{ workout.key_insight }}</p>
                  </div>
                </div>
                
                <div v-if="profile.analysisJson.recent_performance.patterns?.length" class="pt-3 border-t">
                  <h4 class="font-medium mb-2">Performance Patterns:</h4>
                  <div class="space-y-2">
                    <div v-for="(pattern, idx) in profile.analysisJson.recent_performance.patterns" :key="idx" class="flex gap-3">
                      <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <p class="text-gray-700 dark:text-gray-300">{{ pattern }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Recommendations Summary -->
            <UCard v-if="profile.analysisJson.recommendations_summary">
              <template #header>
                <h3 class="text-xl font-semibold flex items-center gap-2">
                  <UIcon name="i-heroicons-light-bulb" class="w-6 h-6" />
                  Coaching Insights
                </h3>
              </template>
              
              <div class="space-y-4">
                <div v-if="profile.analysisJson.recommendations_summary.recurring_themes?.length">
                  <h4 class="font-medium mb-2">Recurring Themes:</h4>
                  <div class="space-y-2">
                    <div v-for="(theme, idx) in profile.analysisJson.recommendations_summary.recurring_themes" :key="idx" class="flex gap-3">
                      <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <p class="text-gray-700 dark:text-gray-300">{{ theme }}</p>
                    </div>
                  </div>
                </div>
                
                <div v-if="profile.analysisJson.recommendations_summary.action_items?.length" class="pt-3 border-t">
                  <h4 class="font-medium mb-3">Action Items:</h4>
                  <div class="space-y-3">
                    <div
                      v-for="(item, idx) in profile.analysisJson.recommendations_summary.action_items"
                      :key="idx"
                      class="flex items-start gap-3 p-3 rounded-lg"
                      :class="getPriorityBackgroundClass(item.priority)"
                    >
                      <UBadge :color="getPriorityBadgeColor(item.priority) as any" size="sm">
                        {{ item.priority }}
                      </UBadge>
                      <p class="flex-1 text-gray-700 dark:text-gray-300">{{ item.action }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Planning Context -->
            <UCard v-if="profile.analysisJson.planning_context">
              <template #header>
                <h3 class="text-xl font-semibold flex items-center gap-2">
                  <UIcon name="i-heroicons-calendar" class="w-6 h-6" />
                  Planning Context
                </h3>
              </template>
              
              <div class="space-y-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 class="font-semibold text-blue-900 dark:text-blue-200 mb-2">Current Focus:</h4>
                  <p class="text-blue-800 dark:text-blue-300">{{ profile.analysisJson.planning_context.current_focus }}</p>
                </div>
                
                <div v-if="profile.analysisJson.planning_context.limitations?.length || profile.analysisJson.planning_context.opportunities?.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-if="profile.analysisJson.planning_context.limitations?.length">
                    <h4 class="font-medium mb-2 text-orange-900 dark:text-orange-200">⚠️ Limitations:</h4>
                    <ul class="space-y-1">
                      <li v-for="limit in profile.analysisJson.planning_context.limitations" :key="limit" class="text-sm text-gray-700 dark:text-gray-300">
                        • {{ limit }}
                      </li>
                    </ul>
                  </div>
                  
                  <div v-if="profile.analysisJson.planning_context.opportunities?.length">
                    <h4 class="font-medium mb-2 text-green-900 dark:text-green-200">✨ Opportunities:</h4>
                    <ul class="space-y-1">
                      <li v-for="opp in profile.analysisJson.planning_context.opportunities" :key="opp" class="text-sm text-gray-700 dark:text-gray-300">
                        • {{ opp }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
          
          <!-- Actions -->
          <div class="mt-6 flex gap-4">
            <UButton
              color="neutral"
              variant="outline"
              @click="handlePrint"
            >
              <UIcon name="i-heroicons-printer" class="w-4 h-4 mr-2" />
              Print / Save as PDF
            </UButton>
            
            <UButton
              color="primary"
              @click="generateNewProfile"
              :loading="generating"
              :disabled="generating"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
              {{ generating ? 'Generating...' : 'Regenerate Profile' }}
            </UButton>
          </div>
        </div>
        
        <div v-else class="text-center py-20">
          <p class="text-gray-600 dark:text-gray-400">No rider profile found</p>
          <UButton @click="generateNewProfile" class="mt-4" :loading="generating">
            Generate Profile
          </UButton>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const toast = useToast()
const generating = ref(false)

definePageMeta({
  middleware: 'auth'
})

// Fetch the most recent rider profile
const { data: profile, pending, refresh } = await useFetch('/api/reports', {
  query: { type: 'RIDER_PROFILE', limit: 1 },
  transform: (data: any) => data && data.length > 0 ? data[0] : null
})

// Poll for updates if profile is processing
if (profile.value?.status === 'PROCESSING') {
  const interval = setInterval(async () => {
    await refresh()
    if (profile.value?.status !== 'PROCESSING') {
      clearInterval(interval)
    }
  }, 5000)
  
  onUnmounted(() => clearInterval(interval))
}

const statusColor = computed(() => {
  if (!profile.value) return 'neutral'
  const colors: Record<string, string> = {
    'PENDING': 'warning',
    'PROCESSING': 'info',
    'COMPLETED': 'success',
    'FAILED': 'error'
  }
  return colors[profile.value.status] || 'neutral'
})

const getStatusBadgeColor = (status: string) => {
  const colors: Record<string, string> = {
    'excellent': 'success',
    'good': 'info',
    'moderate': 'warning',
    'developing': 'info',
    'recovering': 'warning'
  }
  return colors[status] || 'neutral'
}

const getTrendBadgeColor = (trend: string) => {
  const colors: Record<string, string> = {
    'improving': 'success',
    'stable': 'info',
    'declining': 'warning',
    'variable': 'neutral'
  }
  return colors[trend] || 'neutral'
}

const getPriorityBadgeColor = (priority: string) => {
  const colors: Record<string, string> = {
    'high': 'error',
    'medium': 'warning',
    'low': 'success'
  }
  return colors[priority] || 'neutral'
}

const getPriorityBackgroundClass = (priority: string) => {
  const classes: Record<string, string> = {
    'high': 'bg-red-50 dark:bg-red-900/20',
    'medium': 'bg-yellow-50 dark:bg-yellow-900/20',
    'low': 'bg-green-50 dark:bg-green-900/20'
  }
  return classes[priority] || 'bg-gray-50 dark:bg-gray-800'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatShortDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const formatTrend = (trend: string) => {
  const labels: Record<string, string> = {
    'improving': '↗ Improving',
    'stable': '→ Stable',
    'declining': '↘ Declining',
    'variable': '↕ Variable'
  }
  return labels[trend] || trend
}

const handlePrint = () => {
  window.print()
}

async function generateNewProfile() {
  generating.value = true
  try {
    const result: any = await $fetch('/api/profile/generate', { method: 'POST' })
    
    toast.add({
      title: 'Profile Generation Started',
      description: 'Analyzing your training data. This may take a minute...',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
    
    // Poll for result
    const pollForResult = async () => {
      await refresh()
      
      if (profile.value && profile.value.status === 'COMPLETED') {
        toast.add({
          title: 'Profile Ready',
          description: 'Your rider profile has been generated',
          color: 'success',
          icon: 'i-heroicons-check-badge'
        })
        generating.value = false
        return
      }
      
      if (profile.value && profile.value.status === 'FAILED') {
        toast.add({
          title: 'Generation Failed',
          description: 'Unable to generate profile. Please try again.',
          color: 'error',
          icon: 'i-heroicons-exclamation-circle'
        })
        generating.value = false
        return
      }
      
      // Continue polling
      setTimeout(pollForResult, 5000)
    }
    
    setTimeout(pollForResult, 5000)
    
  } catch (error: any) {
    toast.add({
      title: 'Generation Failed',
      description: error.data?.message || 'Failed to generate profile',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
    generating.value = false
  }
}
</script>

<style scoped>
@media print {
  nav, .actions {
    display: none;
  }
}
</style>