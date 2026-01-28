<template>
  <UDashboardPanel id="upload">
    <template #header>
      <UDashboardNavbar title="Upload Workouts">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton to="/data" color="neutral" variant="ghost" icon="i-heroicons-arrow-left">
            Back to Data
          </UButton>
        </template>
        <template #right>
          <ClientOnly>
            <DashboardTriggerMonitorButton />
          </ClientOnly>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-2xl mx-auto p-6 space-y-6">
        <div class="text-center">
          <UIcon name="i-heroicons-cloud-arrow-up" class="w-12 h-12 mx-auto text-gray-400" />
          <h2 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Upload FIT Files</h2>
          <p class="mt-2 text-sm text-gray-500">
            Upload your workout files (.fit) manually. We'll analyze them and add them to your
            history.
          </p>
        </div>

        <UCard class="relative">
          <div
            class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 transition-colors"
            :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-900/10': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept=".fit"
              multiple
              @change="handleFileSelect"
            />

            <div v-if="selectedFiles.length === 0" class="text-center">
              <UButton color="primary" variant="soft" class="mb-4" @click="fileInput?.click()">
                Select Files
              </UButton>
              <p class="text-xs text-gray-500">or drag and drop here</p>
            </div>

            <div v-else class="w-full">
              <div class="max-h-60 overflow-y-auto mb-4 space-y-2">
                <div
                  v-for="(file, index) in selectedFiles"
                  :key="index"
                  class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-document" class="w-5 h-5 text-gray-400" />
                    <span class="text-sm font-medium truncate max-w-[200px]">{{ file.name }}</span>
                    <span class="text-xs text-gray-500">({{ formatFileSize(file.size) }})</span>
                  </div>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-x-mark"
                    size="xs"
                    @click="removeFile(index)"
                  />
                </div>
              </div>

              <div
                class="flex items-center justify-between mt-4 border-t pt-4 dark:border-gray-700"
              >
                <span class="text-sm text-gray-500">{{ selectedFiles.length }} files selected</span>
                <div class="flex gap-2">
                  <UButton color="neutral" variant="ghost" @click="clearFiles">Clear All</UButton>
                  <UButton :loading="uploading" color="primary" @click="uploadFiles">
                    {{ uploading ? 'Uploading...' : 'Upload Workouts' }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <div
          v-if="uploadResult"
          class="rounded-md p-4"
          :class="
            uploadResult.success
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-red-50 dark:bg-red-900/20'
          "
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <UIcon
                :name="uploadResult.success ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                class="h-5 w-5"
                :class="uploadResult.success ? 'text-green-400' : 'text-red-400'"
              />
            </div>
            <div class="ml-3">
              <h3
                class="text-sm font-medium"
                :class="
                  uploadResult.success
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                "
              >
                {{ uploadResult.message }}
              </h3>
              <div
                v-if="uploadResult.results && uploadResult.results.errors.length > 0"
                class="mt-2 text-sm text-red-700 dark:text-red-300"
              >
                <ul class="list-disc list-inside">
                  <li v-for="err in uploadResult.results.errors" :key="err">{{ err }}</li>
                </ul>
              </div>
              <div
                v-if="uploadResult.success"
                class="mt-2 text-sm text-green-700 dark:text-green-300"
              >
                <p>
                  Processing has started in the background. It may take a minute to appear in your
                  dashboard.
                </p>
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

  const fileInput = ref<HTMLInputElement | null>(null)
  const isDragging = ref(false)
  const selectedFiles = ref<File[]>([])
  const uploading = ref(false)
  const uploadResult = ref<{ success: boolean; message: string; results?: any } | null>(null)

  function handleDrop(e: DragEvent) {
    isDragging.value = false
    const files = e.dataTransfer?.files
    if (files?.length) {
      addFiles(Array.from(files))
    }
  }

  function handleFileSelect(e: Event) {
    const files = (e.target as HTMLInputElement).files
    if (files?.length) {
      addFiles(Array.from(files))
    }
  }

  function addFiles(files: File[]) {
    const validFiles = files.filter((file) => file.name.toLowerCase().endsWith('.fit'))

    if (validFiles.length < files.length) {
      useToast().add({
        title: 'Invalid Files Skipped',
        description: 'Only .fit files are allowed.',
        color: 'warning'
      })
    }

    // Avoid duplicates by name + size (simple check)
    const newFiles = validFiles.filter(
      (nf) => !selectedFiles.value.some((sf) => sf.name === nf.name && sf.size === nf.size)
    )

    selectedFiles.value = [...selectedFiles.value, ...newFiles]
    uploadResult.value = null
  }

  function removeFile(index: number) {
    selectedFiles.value.splice(index, 1)
  }

  function clearFiles() {
    selectedFiles.value = []
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    uploadResult.value = null
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const { refresh: refreshRuns } = useUserRuns()
  const { onTaskCompleted } = useUserRunsState()

  // Listen for completion
  onTaskCompleted('ingest-fit-file', async (run) => {
    useToast().add({
      title: 'Processing Complete',
      description: 'A workout file has been analyzed and added to your history.',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  })

  async function uploadFiles() {
    if (selectedFiles.value.length === 0) return

    uploading.value = true
    const formData = new FormData()
    selectedFiles.value.forEach((file) => {
      formData.append('file', file)
    })

    try {
      const response = await $fetch<any>('/api/workouts/upload-fit', {
        method: 'POST',
        body: formData
      })

      uploadResult.value = {
        success: response.success,
        message: response.message,
        results: response.results
      }
      refreshRuns()

      if (response.success) {
        // Clear files after successful upload
        setTimeout(() => {
          clearFiles()
        }, 2000)
      }
    } catch (error: any) {
      uploadResult.value = {
        success: false,
        message: error.data?.message || 'Upload failed'
      }
    } finally {
      uploading.value = false
    }
  }

  useHead({
    title: 'Upload Workouts',
    meta: [{ name: 'description', content: 'Manually upload FIT files to your training history.' }]
  })
</script>
