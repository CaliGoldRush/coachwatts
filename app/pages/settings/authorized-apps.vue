<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
        Authorized Applications
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
        Third-party applications that have access to your Coach Watts account.
      </p>
    </div>

    <div v-if="pending" class="space-y-4">
      <USkeleton v-for="i in 3" :key="i" class="h-24 w-full" />
    </div>

    <div
      v-else-if="consents && consents.length === 0"
      class="py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl"
    >
      <UIcon
        name="i-heroicons-shield-check"
        class="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3"
      />
      <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">
        You haven't authorized any applications yet.
      </p>
    </div>

    <div v-else class="space-y-4">
      <UCard v-for="consent in consents" :key="consent.id">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <UAvatar
              :src="consent.app.logoUrl || undefined"
              :alt="consent.app.name"
              size="lg"
              icon="i-heroicons-cube"
            />
            <div>
              <h3 class="font-bold text-gray-900 dark:text-white">{{ consent.app.name }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Authorized on {{ formatDate(consent.createdAt) }}
              </p>
            </div>
          </div>
          <UButton
            label="Revoke Access"
            color="error"
            variant="ghost"
            icon="i-heroicons-trash"
            size="sm"
            class="font-bold"
            @click="confirmRevoke(consent)"
          />
        </div>

        <USeparator class="my-4" />

        <div>
          <p
            class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2"
          >
            Permissions Granted:
          </p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="scope in consent.scopes"
              :key="scope"
              color="neutral"
              variant="subtle"
              size="sm"
              class="font-medium"
            >
              {{ formatScope(scope) }}
            </UBadge>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Revoke Confirmation Modal -->
    <UModal v-model:open="isRevokeModalOpen" title="Revoke Access">
      <template #body>
        <p class="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Are you sure you want to revoke access for <strong>{{ selectedConsent?.app.name }}</strong
          >? The application will no longer be able to access your data.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="isRevokeModalOpen = false"
          />
          <UButton label="Revoke Access" color="error" :loading="revoking" @click="revokeAccess" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    middleware: 'auth'
  })

  useHead({
    title: 'Authorized Apps',
    meta: [
      {
        name: 'description',
        content: 'Manage third-party applications authorized to access your data.'
      }
    ]
  })

  const toast = useToast()

  const { data: consents, pending, refresh } = await useFetch<any[]>('/api/oauth/consents')

  const isRevokeModalOpen = ref(false)
  const revoking = ref(false)
  const selectedConsent = ref<any>(null)

  function confirmRevoke(consent: any) {
    selectedConsent.value = consent
    isRevokeModalOpen.value = true
  }

  async function revokeAccess() {
    if (!selectedConsent.value) return

    revoking.value = true
    try {
      await $fetch(`/api/oauth/consents/${selectedConsent.value.app.id}`, {
        method: 'DELETE'
      })
      toast.add({ title: 'Success', description: 'Access revoked successfully', color: 'success' })
      isRevokeModalOpen.value = false
      refresh()
    } catch (error: any) {
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to revoke access',
        color: 'error'
      })
    } finally {
      revoking.value = false
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  function formatScope(scope: string) {
    if (scope === 'offline_access') return 'Offline Access'
    const parts = scope.split(':')
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
</script>
