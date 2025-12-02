<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <div>
          <h2 class="text-2xl font-bold">Welcome to Coach Watts!</h2>
          <p class="mt-2 text-muted">Your AI-powered cycling coach is ready to help you optimize your training.</p>
        </div>
      
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UCard v-if="!intervalsConnected">
            <template #header>
              <h3 class="font-semibold">Getting Started</h3>
            </template>
            <p class="text-sm text-muted">
              Connect your Intervals.icu account to start analyzing your training data.
            </p>
            <template #footer>
              <UButton to="/settings" block>
                Connect Intervals.icu
              </UButton>
            </template>
          </UCard>
          
          <UCard v-if="intervalsConnected">
            <template #header>
              <h3 class="font-semibold">Connection Status</h3>
            </template>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-success" />
                <span class="text-sm">Intervals.icu connected</span>
              </div>
              <p class="text-sm text-muted">
                Your training data is being synced automatically.
              </p>
            </div>
            <template #footer>
              <UButton to="/reports" block variant="outline">
                View Reports
              </UButton>
            </template>
          </UCard>
          
          <!-- Rider Profile Card - shown when connected -->
          <UCard v-if="intervalsConnected">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-user-circle" class="w-5 h-5" />
                <h3 class="font-semibold">Rider Profile</h3>
              </div>
            </template>
            
            <!-- Loading skeleton -->
            <div v-if="!profile" class="space-y-3 text-sm animate-pulse">
              <div>
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              </div>
              <div class="pt-2 border-t space-y-2">
                <div class="flex justify-between">
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
                <div class="flex justify-between">
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div class="flex justify-between">
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            </div>
            
            <!-- Actual profile data -->
            <div v-else class="space-y-3 text-sm">
              <div>
                <p class="font-medium">{{ profile.name || 'Athlete' }}</p>
                <p class="text-muted text-xs">
                  <span v-if="profile.age">{{ profile.age }}y</span>
                  <span v-if="profile.age && profile.sex"> • </span>
                  <span v-if="profile.sex">{{ profile.sex === 'M' ? 'Male' : 'Female' }}</span>
                  <span v-if="(profile.age || profile.sex) && profile.weight"> • </span>
                  <span v-if="profile.weight">{{ profile.weight }}kg</span>
                </p>
                <p v-if="profile.location?.city" class="text-muted text-xs">
                  {{ [profile.location.city, profile.location.country].filter(Boolean).join(', ') }}
                </p>
              </div>
              
              <div class="pt-2 border-t space-y-2">
                <div class="flex justify-between">
                  <span class="text-muted">FTP</span>
                  <span class="font-medium">{{ profile.ftp ? `${profile.ftp}W` : 'Not set' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Resting HR</span>
                  <span class="font-medium">{{ profile.restingHR ? `${profile.restingHR} bpm` : 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Recent HRV</span>
                  <span class="font-medium">{{ profile.recentHRV ? `${Math.round(profile.recentHRV)} ms` : 'N/A' }}</span>
                </div>
                <div v-if="profile.avgRecentHRV" class="flex justify-between">
                  <span class="text-muted text-xs">7-day HRV avg</span>
                  <span class="font-medium text-xs">{{ Math.round(profile.avgRecentHRV) }} ms</span>
                </div>
              </div>
            </div>
          </UCard>
          
          <!-- Recent Activity Card -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Recent Activity</h3>
            </template>
            <p v-if="!intervalsConnected" class="text-sm text-muted text-center py-4">
              No workouts found. Connect your Intervals.icu account to sync your training data.
            </p>
            <p v-else class="text-sm text-muted text-center py-4">
              Your workouts are syncing. Check back soon or view the Reports page.
            </p>
          </UCard>
        </div>
      
        <UCard>
          <template #header>
            <h3 class="font-semibold">Next Steps</h3>
          </template>
          <ul class="space-y-2 text-sm text-muted">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-success" />
              Account created successfully
            </li>
            <li class="flex items-center gap-2">
              <UIcon
                :name="intervalsConnected ? 'i-heroicons-check-circle' : 'i-heroicons-arrow-path'"
                :class="intervalsConnected ? 'w-5 h-5 text-success' : 'w-5 h-5'"
              />
              Connect Intervals.icu
            </li>
            <li class="flex items-center gap-2">
              <UIcon
                :name="intervalsConnected ? 'i-heroicons-check-circle' : 'i-heroicons-arrow-path'"
                :class="intervalsConnected ? 'w-5 h-5 text-success' : 'w-5 h-5'"
              />
              Sync your training data
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-path" class="w-5 h-5" />
              Get your first AI coaching report
            </li>
          </ul>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

// Integration status - use lazy to avoid SSR issues
const { data: integrationStatus } = useFetch('/api/integrations/status', {
  lazy: true,
  server: false
})

const intervalsConnected = computed(() =>
  integrationStatus.value?.integrations?.some((i: any) => i.provider === 'intervals') ?? false
)

// Fetch rider profile when connected
const { data: profileData } = useFetch('/api/profile', {
  lazy: true,
  server: false,
  watch: [intervalsConnected]
})

const profile = computed(() => profileData.value?.profile || null)
</script>