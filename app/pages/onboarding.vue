<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Welcome to Coach Watts</h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Before we get started, please review and accept our terms to continue using the platform.
      </p>
    </div>

    <form class="space-y-6" @submit.prevent="submitConsent">
      <div class="space-y-4">
        <UCheckbox
          v-model="acceptedTerms"
          name="terms"
          label="I agree to the Terms of Service and Privacy Policy"
        >
          <template #label>
            <span class="text-sm text-gray-700 dark:text-gray-300">
              I agree to the
              <a
                href="/terms"
                target="_blank"
                class="text-primary-600 hover:text-primary-500 font-medium"
                >Terms of Service</a
              >
              and
              <a
                href="/privacy"
                target="_blank"
                class="text-primary-600 hover:text-primary-500 font-medium"
                >Privacy Policy</a
              >.
            </span>
          </template>
        </UCheckbox>

        <UCheckbox
          v-model="acceptedHealth"
          name="health"
          label="I explicitly consent to processing of health data"
        >
          <template #label>
            <span class="text-sm text-gray-700 dark:text-gray-300">
              I explicitly consent to the processing of my health and biometric data (including
              heart rate, power, and location) by Coach Watts and its AI providers to generate
              coaching insights.
            </span>
          </template>
        </UCheckbox>
      </div>

      <UButton type="submit" block :disabled="!isValid" :loading="loading"> Continue </UButton>
    </form>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    layout: 'simple',
    middleware: 'auth' // Ensure user is logged in (but specific onboarding middleware handles the redirection logic)
  })

  const { data: session, refresh } = useAuth()
  const acceptedTerms = ref(false)
  const acceptedHealth = ref(false)
  const loading = ref(false)

  const isValid = computed(() => acceptedTerms.value && acceptedHealth.value)

  // Constants for policy versions
  const TOS_VERSION = '1.0' // TODO: Move to a shared config if needed
  const PRIVACY_VERSION = '1.0'

  async function submitConsent() {
    if (!isValid.value) return

    loading.value = true
    try {
      await $fetch('/api/user/consent', {
        method: 'POST',
        body: {
          termsVersion: TOS_VERSION,
          privacyPolicyVersion: PRIVACY_VERSION
        }
      })

      // Refresh session to update termsAcceptedAt locally if possible,
      // though usually a page reload or full session refresh is needed.
      // For now, we rely on the redirect to work.
      // Force a session reload might be tricky without a plugin,
      // but the next navigation check should ideally query the updated state or allow through based on the client-side knowledge.

      // Simplest approach: Update session manually if the library allows, or just redirect.
      // Since our middleware checks the session, we might need to reload the page or trigger a session refetch.
      await refresh()

      navigateTo('/dashboard')
    } catch (error) {
      console.error('Failed to save consent:', error)
      // You might want to show a toast notification here
    } finally {
      loading.value = false
    }
  }
</script>
