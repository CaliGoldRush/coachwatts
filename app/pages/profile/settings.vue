<template>
  <UDashboardPanel id="profile-settings">
    <template #header>
      <UDashboardNavbar title="Profile Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Tabs -->
        <div class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
          <div class="px-6 flex gap-6">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              class="relative py-4 text-sm font-medium transition-colors"
              :class="activeTab === tab.id ? 'text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
            >
              <div class="flex items-center gap-2">
                <UIcon :name="tab.icon" class="w-4 h-4" />
                {{ tab.label }}
              </div>
              <div 
                v-if="activeTab === tab.id"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
              ></div>
            </button>
          </div>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="max-w-4xl mx-auto space-y-8">
            
            <ProfileBasicSettings
              v-if="activeTab === 'basic'"
              :model-value="profile"
              @update:model-value="handleProfileUpdate"
              :email="user?.email || ''"
            />
            
            <ProfileCustomZones 
              v-if="activeTab === 'zones'"
              v-model:hrZones="hrZones"
              v-model:powerZones="powerZones"
            />
            
            <ProfileGoalsSettings 
              v-if="activeTab === 'goals'" 
            />
            
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import ProfileBasicSettings from '~/components/profile/BasicSettings.vue'
import ProfileCustomZones from '~/components/profile/CustomZones.vue'
import ProfileGoalsSettings from '~/components/profile/GoalsSettings.vue'

const { data } = useAuth()
const user = computed(() => data.value?.user)
const toast = useToast()

definePageMeta({
  middleware: 'auth'
})

const tabs = [
  { id: 'basic', label: 'Basic Settings', icon: 'i-heroicons-user-circle' },
  { id: 'zones', label: 'Custom Zones', icon: 'i-heroicons-chart-bar' },
  { id: 'goals', label: 'Goals', icon: 'i-heroicons-trophy' }
]

const activeTab = ref('basic')

// Profile Data
const profile = ref({
  name: user.value?.name || 'Athlete',
  language: 'English',
  weight: 0,
  weightUnits: 'Kilograms',
  height: 0,
  heightUnits: 'cm',
  distanceUnits: 'Kilometers',
  temperatureUnits: 'Celsius',
  restingHr: 0,
  maxHr: 0,
  ftp: 0,
  form: 'Absolute value',
  visibility: 'Private',
  sex: 'Male',
  dob: '',
  city: '',
  state: '',
  country: '',
  timezone: ''
})

// Fetch profile data
const { data: profileData, refresh: refreshProfile } = await useFetch('/api/profile', {
  key: 'user-profile'
})

watchEffect(() => {
  if (profileData.value?.profile) {
    profile.value = { ...profile.value, ...profileData.value.profile }
  }
})

async function handleProfileUpdate(newProfile: any) {
  console.log('Profile update received:', newProfile)
  // Use Object.assign to update the existing reactive object
  Object.assign(profile.value, newProfile)
  
  try {
    const response = await $fetch('/api/profile', {
      method: 'PATCH',
      body: newProfile
    })
    
    console.log('Profile update response:', response)
    
    toast.add({
      title: 'Profile Updated',
      description: 'Your settings have been saved.',
      color: 'success',
      timeout: 2000
    })
  } catch (error) {
    console.error('Profile update failed:', error)
    toast.add({
      title: 'Update Failed',
      description: 'Failed to save profile settings.',
      color: 'error'
    })
  }
}

const hrZones = ref([
    { name: 'Z1 Recovery', min: 60, max: 120 },
    { name: 'Z2 Endurance', min: 121, max: 145 },
    { name: 'Z3 Tempo', min: 146, max: 160 },
    { name: 'Z4 Threshold', min: 161, max: 175 },
    { name: 'Z5 Anaerobic', min: 176, max: 185 }
])

const powerZones = ref([
    { name: 'Z1 Active Recovery', min: 0, max: 137 },
    { name: 'Z2 Endurance', min: 137, max: 187 },
    { name: 'Z3 Tempo', min: 188, max: 225 },
    { name: 'Z4 Threshold', min: 226, max: 262 },
    { name: 'Z5 VO2 Max', min: 263, max: 999 }
])

</script>