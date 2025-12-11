<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  middleware: 'auth'
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  parts: Array<{
    type: 'text'
    id: string
    text: string
  }>
  metadata?: {
    charts?: Array<{
      id: string
      type: 'line' | 'bar' | 'doughnut' | 'radar'
      title: string
      labels: string[]
      datasets: Array<{
        label: string
        data: number[]
        color?: string
      }>
    }>
    createdAt?: Date
    senderId?: string
  }
}

// State
const input = ref('')
const messages = ref<Message[]>([])
const status = ref<'ready' | 'submitted' | 'streaming' | 'error'>('ready')
const error = ref<Error | null>(null)
const currentRoomId = ref('')
const loadingMessages = ref(true)

// Fetch session and initialize
const { data: session } = await useFetch('/api/auth/session')
const currentUserId = computed(() => (session.value?.user as any)?.id)

// Load initial room and messages
onMounted(async () => {
  await loadChat()
})

async function loadChat() {
  try {
    loadingMessages.value = true
    
    // Get or create room
    const rooms = await $fetch<any[]>('/api/chat/rooms')
    if (rooms && rooms.length > 0) {
      currentRoomId.value = rooms[0].roomId
      
      // Load messages
      const loadedMessages = await $fetch<Message[]>(`/api/chat/messages?roomId=${currentRoomId.value}`)
      messages.value = loadedMessages
    }
  } catch (err: any) {
    console.error('Failed to load chat:', err)
    error.value = err
  } finally {
    loadingMessages.value = false
  }
}

async function onSubmit() {
  if (!input.value.trim() || !currentRoomId.value) return
  
  const userMessage = input.value.trim()
  input.value = ''
  
  // Add user message immediately
  const tempUserMessage: Message = {
    id: `temp-${Date.now()}`,
    role: 'user',
    parts: [{
      type: 'text',
      id: `text-temp-${Date.now()}`,
      text: userMessage
    }],
    metadata: {
      createdAt: new Date()
    }
  }
  messages.value.push(tempUserMessage)
  
  try {
    status.value = 'submitted'
    error.value = null
    
    // Send message and get AI response
    const response = await $fetch<Message>('/api/chat/messages', {
      method: 'POST',
      body: {
        roomId: currentRoomId.value,
        content: userMessage
      }
    })
    
    // Replace temp message with real one and add AI response
    messages.value = messages.value.filter(m => m.id !== tempUserMessage.id)
    messages.value.push({
      id: `user-${Date.now()}`,
      role: 'user',
      parts: [{
        type: 'text',
        id: `text-user-${Date.now()}`,
        text: userMessage
      }],
      metadata: {
        createdAt: new Date()
      }
    })
    messages.value.push(response)
    
    status.value = 'ready'
  } catch (err: any) {
    console.error('Failed to send message:', err)
    error.value = err
    status.value = 'error'
    
    // Remove temp message on error
    messages.value = messages.value.filter(m => m.id !== tempUserMessage.id)
  }
}

async function createNewChat() {
  try {
    const newRoom = await $fetch('/api/chat/rooms', {
      method: 'POST'
    })
    currentRoomId.value = (newRoom as any).roomId
    messages.value = []
    input.value = ''
  } catch (err: any) {
    console.error('Failed to create new chat:', err)
  }
}

// Helper to get text from message
function getTextFromMessage(message: Message): string {
  return message.parts.find(p => p.type === 'text')?.text || ''
}

// Helper to get charts from message
function getChartsFromMessage(message: Message) {
  return message.metadata?.charts || []
}
</script>

<template>
  <UDashboardPanel id="chat">
    <template #header>
      <UDashboardNavbar title="Chat with Coach Watts">
        <template #right>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-plus"
            aria-label="New Chat"
            size="sm"
            @click="createNewChat"
          />
          <UButton
            to="/settings/ai"
            color="neutral"
            variant="ghost"
            icon="i-heroicons-cog-6-tooth"
            aria-label="AI Settings"
            size="sm"
          />
        </template>
      </UDashboardNavbar>
    </template>
    
    <template #body>
      <UContainer class="h-full">
        <div v-if="loadingMessages" class="flex items-center justify-center h-full">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
        </div>
        
        <UChatMessages
          v-else
          :messages="messages"
          :status="status"
          :should-auto-scroll="true"
          :user="{
            side: 'right',
            variant: 'soft'
          }"
          :assistant="{
            side: 'left',
            variant: 'naked',
            avatar: { src: '/images/logo.svg' }
          }"
        >
          <!-- Custom content rendering for each message -->
          <template #content="{ message }">
            <div class="space-y-4">
              <!-- Text content with markdown support -->
              <div v-if="getTextFromMessage(message)" class="prose prose-sm dark:prose-invert max-w-none">
                <MDC :value="getTextFromMessage(message)" :cache-key="message.id" />
              </div>
              
              <!-- Inline charts -->
              <div v-if="getChartsFromMessage(message).length > 0" class="space-y-4">
                <ChatChart
                  v-for="chart in getChartsFromMessage(message)"
                  :key="chart.id"
                  :chart-data="chart"
                />
              </div>
            </div>
          </template>
        </UChatMessages>
      </UContainer>
    </template>

    <template #footer>
      <UContainer class="pb-4 sm:pb-6">
        <UChatPrompt
          v-model="input"
          :error="error"
          placeholder="Ask Coach Watts anything about your training..."
          @submit="onSubmit"
        >
          <UChatPromptSubmit
            :status="status"
            @stop="() => {}"
            @reload="() => {}"
          />
        </UChatPrompt>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
