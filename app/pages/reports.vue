<template>
  <UDashboardPanel id="reports">
    <template #header>
      <UDashboardNavbar title="Reports">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex gap-2 flex-wrap">
            <UButton
              @click="generateReport('LAST_3_WORKOUTS')"
              :loading="generating"
              size="sm"
            >
              <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 mr-2" />
              Last 3 Workouts
            </UButton>
            <UButton
              @click="generateReport('WEEKLY_ANALYSIS')"
              :loading="generating"
              size="sm"
              variant="outline"
            >
              <UIcon name="i-heroicons-calendar" class="w-4 h-4 mr-2" />
              Weekly Analysis
            </UButton>
            <UButton
              @click="generateReport('LAST_3_NUTRITION')"
              :loading="generating"
              size="sm"
              color="success"
            >
              <UIcon name="i-heroicons-cake" class="w-4 h-4 mr-2" />
              Last 3 Days Nutrition
            </UButton>
            <UButton
              @click="generateReport('LAST_7_NUTRITION')"
              :loading="generating"
              size="sm"
              color="success"
              variant="outline"
            >
              <UIcon name="i-heroicons-cake" class="w-4 h-4 mr-2" />
              Weekly Nutrition
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <div>
          <h2 class="text-2xl font-bold">Your Reports</h2>
          <p class="text-muted mt-1">AI-generated training analysis and recommendations</p>
        </div>
        
        <!-- Reports Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div v-if="status === 'pending'" class="p-8 text-center text-gray-600 dark:text-gray-400">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p>Loading reports...</p>
          </div>
          
          <div v-else-if="status === 'error'" class="p-8 text-center text-red-600 dark:text-red-400">
            <UIcon name="i-heroicons-exclamation-circle" class="w-8 h-8 mx-auto mb-2" />
            <p>Error loading reports</p>
            <UButton size="sm" color="neutral" variant="solid" class="mt-2" @click="() => refresh()">Retry</UButton>
          </div>

          <div v-else-if="!reports?.length" class="p-8 text-center text-gray-600 dark:text-gray-400">
            <UIcon name="i-heroicons-document-text" class="w-16 h-16 text-muted mx-auto mb-4" />
            <p class="mb-4">No reports yet</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
              <UButton
                @click="generateReport('LAST_3_WORKOUTS')"
                :loading="generating"
              >
                <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 mr-2" />
                Last 3 Workouts
              </UButton>
              <UButton
                @click="generateReport('WEEKLY_ANALYSIS')"
                :loading="generating"
                variant="outline"
              >
                <UIcon name="i-heroicons-calendar" class="w-4 h-4 mr-2" />
                Weekly Analysis
              </UButton>
              <UButton
                @click="generateReport('LAST_3_NUTRITION')"
                :loading="generating"
                color="success"
              >
                <UIcon name="i-heroicons-cake" class="w-4 h-4 mr-2" />
                Last 3 Days Nutrition
              </UButton>
              <UButton
                @click="generateReport('LAST_7_NUTRITION')"
                :loading="generating"
                color="success"
                variant="outline"
              >
                <UIcon name="i-heroicons-cake" class="w-4 h-4 mr-2" />
                Weekly Nutrition
              </UButton>
            </div>
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Report Type
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="report in reports"
                  :key="report.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div class="flex items-center gap-2">
                      <UIcon :name="getReportIcon(report.type)" class="w-5 h-5 text-primary" />
                      <span class="font-medium">{{ getReportTitle(report.type) }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {{ formatDateRange(report.dateRangeStart, report.dateRangeEnd) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span :class="getStatusBadgeClass(report.status)">
                      {{ report.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {{ formatDate(report.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <UButton
                      size="xs"
                      color="primary"
                      variant="outline"
                      @click="navigateTo(`/report/${report.id}`)"
                    >
                      View Report
                    </UButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

  </UDashboardPanel>
</template>

<script setup lang="ts">
// Type definitions
interface ReportType {
  value: string
  label: string
  description: string
  icon: string
}

interface Report {
  id: string
  type: string
  status: string
  createdAt: string
  updatedAt: string
  dateRangeStart: string
  dateRangeEnd: string
  modelVersion?: string
}

// State
const generating = ref(false)
const toast = useToast()

definePageMeta({
  middleware: 'auth'
})

// Fetch reports data
const { data: reports, status, refresh } = await useFetch<Report[]>('/api/reports')

// Centralized report type configuration
const REPORT_TYPE_CONFIG = {
  'LAST_3_WORKOUTS': {
    label: 'Last 3 Workouts Analysis',
    icon: 'i-heroicons-chart-bar',
    description: 'Analyze your 3 most recent endurance workouts to identify trends, progression, and recovery patterns.'
  },
  'WEEKLY_ANALYSIS': {
    label: 'Weekly Training Analysis',
    icon: 'i-heroicons-calendar',
    description: 'Comprehensive analysis of the last 30 days of training including workouts, recovery metrics, and recommendations.'
  },
  'LAST_3_NUTRITION': {
    label: 'Last 3 Days Nutrition',
    icon: 'i-heroicons-cake',
    description: 'Nutrition analysis of your last 3 days of dietary intake including macros, calories, and recommendations.'
  },
  'LAST_7_NUTRITION': {
    label: 'Weekly Nutrition Analysis',
    icon: 'i-heroicons-cake',
    description: 'Comprehensive weekly nutrition analysis including patterns, consistency, and optimization opportunities.'
  },
  'RACE_PREP': {
    label: 'Race Preparation Report',
    icon: 'i-heroicons-trophy',
    description: 'Comprehensive race preparation analysis with taper recommendations and readiness assessment.'
  },
  'DAILY_SUGGESTION': {
    label: 'Daily Coaching Brief',
    icon: 'i-heroicons-light-bulb',
    description: 'Daily training suggestions based on your current fitness and recovery status.'
  },
  'CUSTOM': {
    label: 'Custom Report',
    icon: 'i-heroicons-document-text',
    description: 'Custom training analysis report.'
  }
} as const

const generateReport = async (reportType: string) => {
  generating.value = true
  try {
    const result = await $fetch<{ reportId: string }>('/api/reports/generate', {
      method: 'POST',
      body: { type: reportType }
    })
    
    toast.add({
      title: 'Report Generation Started',
      description: 'Your report is being generated. This may take a minute.',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
    
    await refresh()
    navigateTo(`/report/${result.reportId}`)
  } catch (error) {
    console.error('Failed to generate report:', error)
    toast.add({
      title: 'Generation Failed',
      description: error instanceof Error ? error.message : 'Failed to start report generation',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  } finally {
    generating.value = false
  }
}

const getReportTitle = (type: string): string => {
  type ReportTypeKey = keyof typeof REPORT_TYPE_CONFIG
  if (type in REPORT_TYPE_CONFIG) {
    return REPORT_TYPE_CONFIG[type as ReportTypeKey].label
  }
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getReportIcon = (type: string): string => {
  type ReportTypeKey = keyof typeof REPORT_TYPE_CONFIG
  if (type in REPORT_TYPE_CONFIG) {
    return REPORT_TYPE_CONFIG[type as ReportTypeKey].icon
  }
  return 'i-heroicons-document-text'
}

const getStatusBadgeClass = (status: string) => {
  const baseClass = 'px-2 py-1 rounded text-xs font-medium'
  if (status === 'COMPLETED') return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`
  if (status === 'PROCESSING') return `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`
  if (status === 'PENDING') return `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`
  if (status === 'FAILED') return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
  return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
}

const formatDateRange = (start: string, end: string) => {
  const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endDate = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startDate} - ${endDate}`
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>