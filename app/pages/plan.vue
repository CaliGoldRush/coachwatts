<template>
  <UDashboardPanel id="training-plan-page">
    <template #header>
      <UDashboardNavbar title="Training Plan">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton 
            v-if="activePlan"
            size="xs" 
            color="gray" 
            variant="ghost" 
            icon="i-heroicons-plus" 
            @click="startNewPlan"
          >
            New Plan
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-20">
          <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary" />
        </div>

        <!-- Active Plan View -->
        <div v-else-if="activePlan">
           <PlanDashboard :plan="activePlan" @refresh="fetchActivePlan" />
        </div>

        <!-- No Plan State / Onboarding -->
        <div v-else class="max-w-4xl mx-auto text-center py-12">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-10">
            <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <UIcon name="i-heroicons-trophy" class="w-10 h-10 text-primary" />
            </div>
            <h2 class="text-3xl font-bold mb-3">Start Your Goal-Driven Plan</h2>
            <p class="text-lg text-muted mb-8 max-w-lg mx-auto">
              Select a race or fitness goal, and let our AI build a periodized training plan tailored to your schedule and physiology.
            </p>
            <UButton size="xl" color="primary" @click.stop="openWizard">
              Create Training Plan
            </UButton>
          </div>
        </div>

        <!-- Plan Wizard Modal -->
        <!-- Only render if explicitly open to prevent ghost clicks -->
        <UModal 
          v-if="showWizard"
          v-model:open="showWizard" 
          :ui="{ width: 'sm:max-w-4xl' }"
          title="Create Training Plan"
          description="Follow the steps to configure your personalized training plan."
        >
          <template #body>
             <div class="p-6">
               <PlanWizard @close="showWizard = false" @plan-created="onPlanCreated" />
             </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import PlanWizard from '~/components/plans/PlanWizard.vue'
import PlanDashboard from '~/components/plans/PlanDashboard.vue'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Training Plan',
})

const loading = ref(true)
const activePlan = ref<any>(null)
const showWizard = ref(false)

async function fetchActivePlan() {
  loading.value = true
  try {
    const data: any = await $fetch('/api/plans/active')
    activePlan.value = data.plan
  } catch (error) {
    console.error('Failed to fetch plan', error)
  } finally {
    loading.value = false
  }
}

function openWizard() {
  showWizard.value = true
}

function startNewPlan() {
  if (confirm('Create a new plan? This will archive your current active plan.')) {
    openWizard()
  }
}

function onPlanCreated(plan: any) {
  activePlan.value = plan
  showWizard.value = false
  fetchActivePlan() // Refresh to get full relations if needed
}

// Safety: Ensure wizard is closed if plan loads successfully on mount
watch(activePlan, (val) => {
  if (val && !showWizard.value) {
    // Keep it closed
  } else if (val && showWizard.value) {
    // If a plan exists but wizard is open, user might be creating a NEW one. 
    // So we don't auto-close here to allow "New Plan" flow.
  }
})

onMounted(() => {
  fetchActivePlan()
})
</script>
