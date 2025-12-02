<template>
  <UDashboardPanel id="nutrition-detail">
    <template #header>
      <UDashboardNavbar :title="nutrition ? `Nutrition: ${formatDate(nutrition.date)}` : 'Nutrition Details'">
        <template #leading>
          <UButton
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            to="/data"
          >
            Back to Data
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading nutrition data...</p>
          </div>
        </div>

        <div v-else-if="error" class="text-center py-12">
          <div class="text-red-600 dark:text-red-400">
            <p class="text-lg font-semibold">{{ error }}</p>
          </div>
        </div>

        <div v-else-if="nutrition" class="space-y-6">
          <!-- Header Card -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Daily Nutrition
                </h1>
                <div class="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div class="flex items-center gap-1">
                    <span class="i-heroicons-calendar w-4 h-4"></span>
                    {{ formatDate(nutrition.date) }}
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="i-heroicons-fire w-4 h-4"></span>
                    {{ nutrition.calories }} / {{ nutrition.caloriesGoal }} kcal
                  </div>
                </div>
              </div>
              <div>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  Yazio
                </span>
              </div>
            </div>
          </div>

          <!-- Macros Summary -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <!-- Calories -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Calories</h3>
                <span class="i-heroicons-fire w-5 h-5 text-orange-500"></span>
              </div>
              <div class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ nutrition.calories }}
              </div>
              <div class="mt-1 text-xs text-gray-500">
                Goal: {{ nutrition.caloriesGoal }} kcal
              </div>
              <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="bg-orange-500 h-2 rounded-full transition-all"
                  :style="{ width: getPercentage(nutrition.calories, nutrition.caloriesGoal) + '%' }"
                ></div>
              </div>
            </div>

            <!-- Protein -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Protein</h3>
                <span class="i-heroicons-bolt w-5 h-5 text-blue-500"></span>
              </div>
              <div class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ Math.round(nutrition.protein) }}g
              </div>
              <div class="mt-1 text-xs text-gray-500">
                Goal: {{ Math.round(nutrition.proteinGoal) }}g
              </div>
              <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="bg-blue-500 h-2 rounded-full transition-all"
                  :style="{ width: getPercentage(nutrition.protein, nutrition.proteinGoal) + '%' }"
                ></div>
              </div>
            </div>

            <!-- Carbs -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Carbs</h3>
                <span class="i-heroicons-cube w-5 h-5 text-yellow-500"></span>
              </div>
              <div class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ Math.round(nutrition.carbs) }}g
              </div>
              <div class="mt-1 text-xs text-gray-500">
                Goal: {{ Math.round(nutrition.carbsGoal) }}g
              </div>
              <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="bg-yellow-500 h-2 rounded-full transition-all"
                  :style="{ width: getPercentage(nutrition.carbs, nutrition.carbsGoal) + '%' }"
                ></div>
              </div>
            </div>

            <!-- Fat -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Fat</h3>
                <span class="i-heroicons-beaker w-5 h-5 text-green-500"></span>
              </div>
              <div class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ Math.round(nutrition.fat) }}g
              </div>
              <div class="mt-1 text-xs text-gray-500">
                Goal: {{ Math.round(nutrition.fatGoal) }}g
              </div>
              <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="bg-green-500 h-2 rounded-full transition-all"
                  :style="{ width: getPercentage(nutrition.fat, nutrition.fatGoal) + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Water Intake -->
          <div v-if="nutrition.waterMl" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center gap-2 mb-4">
              <span class="i-heroicons-beaker w-6 h-6 text-blue-400"></span>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">Water Intake</h2>
            </div>
            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {{ (nutrition.waterMl / 1000).toFixed(1) }}L
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ nutrition.waterMl }}ml consumed
            </div>
          </div>

          <!-- Meals Breakdown -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Meals Breakdown</h2>
            
            <div class="space-y-6">
              <!-- Breakfast -->
              <div v-if="nutrition.breakfast && nutrition.breakfast.length > 0">
                <div class="flex items-center gap-2 mb-3">
                  <span class="i-heroicons-sun w-5 h-5 text-yellow-500"></span>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Breakfast</h3>
                  <span class="text-sm text-gray-500">({{ nutrition.breakfast.length }} items)</span>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="item in nutrition.breakfast"
                    :key="item.id"
                    class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ item.product_name || 'Unknown Product' }}
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span v-if="item.product_brand" class="text-gray-500">{{ item.product_brand }} • </span>
                          {{ item.amount }}{{ item.serving ? ` ${item.serving}` : 'g' }}
                          <span v-if="item.serving_quantity"> × {{ item.serving_quantity }}</span>
                        </div>
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ formatTime(item.date) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Lunch -->
              <div v-if="nutrition.lunch && nutrition.lunch.length > 0">
                <div class="flex items-center gap-2 mb-3">
                  <span class="i-heroicons-sun w-5 h-5 text-orange-500"></span>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Lunch</h3>
                  <span class="text-sm text-gray-500">({{ nutrition.lunch.length }} items)</span>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="item in nutrition.lunch"
                    :key="item.id"
                    class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ item.product_name || 'Unknown Product' }}
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span v-if="item.product_brand" class="text-gray-500">{{ item.product_brand }} • </span>
                          {{ item.amount }}{{ item.serving ? ` ${item.serving}` : 'g' }}
                          <span v-if="item.serving_quantity"> × {{ item.serving_quantity }}</span>
                        </div>
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ formatTime(item.date) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dinner -->
              <div v-if="nutrition.dinner && nutrition.dinner.length > 0">
                <div class="flex items-center gap-2 mb-3">
                  <span class="i-heroicons-moon w-5 h-5 text-indigo-500"></span>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Dinner</h3>
                  <span class="text-sm text-gray-500">({{ nutrition.dinner.length }} items)</span>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="item in nutrition.dinner"
                    :key="item.id"
                    class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ item.product_name || 'Unknown Product' }}
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span v-if="item.product_brand" class="text-gray-500">{{ item.product_brand }} • </span>
                          {{ item.amount }}{{ item.serving ? ` ${item.serving}` : 'g' }}
                          <span v-if="item.serving_quantity"> × {{ item.serving_quantity }}</span>
                        </div>
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ formatTime(item.date) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Snacks -->
              <div v-if="nutrition.snacks && nutrition.snacks.length > 0">
                <div class="flex items-center gap-2 mb-3">
                  <span class="i-heroicons-cake w-5 h-5 text-pink-500"></span>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Snacks</h3>
                  <span class="text-sm text-gray-500">({{ nutrition.snacks.length }} items)</span>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="item in nutrition.snacks"
                    :key="item.id"
                    class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ item.product_name || 'Unknown Product' }}
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span v-if="item.product_brand" class="text-gray-500">{{ item.product_brand }} • </span>
                          {{ item.amount }}{{ item.serving ? ` ${item.serving}` : 'g' }}
                          <span v-if="item.serving_quantity"> × {{ item.serving_quantity }}</span>
                        </div>
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ formatTime(item.date) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No meals logged -->
              <div v-if="!hasAnyMeals" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No meals logged for this day
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const nutrition = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const hasAnyMeals = computed(() => {
  if (!nutrition.value) return false
  return (
    (nutrition.value.breakfast && nutrition.value.breakfast.length > 0) ||
    (nutrition.value.lunch && nutrition.value.lunch.length > 0) ||
    (nutrition.value.dinner && nutrition.value.dinner.length > 0) ||
    (nutrition.value.snacks && nutrition.value.snacks.length > 0)
  )
})

// Fetch nutrition data
async function fetchNutrition() {
  loading.value = true
  error.value = null
  
  try {
    const id = route.params.id as string
    nutrition.value = await $fetch(`/api/nutrition/${id}`)
  } catch (e: any) {
    console.error('Error fetching nutrition:', e)
    error.value = e.data?.message || e.message || 'Failed to load nutrition data'
  } finally {
    loading.value = false
  }
}

// Utility functions
function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatTime(dateTime: string) {
  return new Date(dateTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getPercentage(value: number, goal: number) {
  if (!goal) return 0
  return Math.min(Math.round((value / goal) * 100), 100)
}

// Load data on mount
onMounted(() => {
  fetchNutrition()
})
</script>