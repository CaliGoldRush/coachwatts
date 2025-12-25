<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { data, signOut } = useAuth()
const user = computed(() => data.value?.user)

const impersonationMeta = useCookie<{
  adminId: string
  adminEmail: string
  impersonatedUserId: string
  impersonatedUserEmail: string
}>('auth.impersonation_meta')

const impersonatedEmail = computed(() => impersonationMeta.value?.impersonatedUserEmail)

const route = useRoute()

const open = ref(false)

const links = computed<NavigationMenuItem[][]>(() => {
  const primaryLinks: any[] = [{
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Activities',
    icon: 'i-lucide-calendar-days',
    to: '/activities',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Performance',
    icon: 'i-lucide-trending-up',
    to: '/performance',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Training Plan',
    icon: 'i-lucide-calendar',
    to: '/plan',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Workouts',
    icon: 'i-lucide-activity',
    to: '/workouts',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Nutrition',
    icon: 'i-lucide-utensils',
    to: '/nutrition',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Fitness',
    icon: 'i-lucide-heart-pulse',
    to: '/fitness',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Goals',
    icon: 'i-lucide-trophy',
    to: '/profile/goals',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Events',
    icon: 'i-lucide-flag',
    to: '/events',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Reports',
    icon: 'i-lucide-file-text',
    to: '/reports',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Coaching',
    icon: 'i-lucide-users',
    to: '/coaching',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'AI Chat',
    icon: 'i-lucide-message-circle',
    to: '/chat',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Data',
    icon: 'i-lucide-database',
    to: '/data',
    onSelect: () => {
      open.value = false
    }
  }]

  if ((user.value as any)?.isAdmin) {
    primaryLinks.push({
      label: 'Admin',
      icon: 'i-lucide-shield-check',
      to: '/admin',
      onSelect: () => {
        open.value = false
      }
    })
  }

  primaryLinks.push({
    label: 'Settings',
    icon: 'i-lucide-settings',
    defaultOpen: route.path.includes('settings'),
    children: [{
      label: 'Profile',
      icon: 'i-lucide-user',
      to: '/profile/settings',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Apps',
      icon: 'i-lucide-layout-grid',
      to: '/settings/apps',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'AI Coach',
      icon: 'i-lucide-sparkles',
      to: '/settings/ai',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Coaching',
      icon: 'i-lucide-users',
      to: '/settings/coaching',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Developer',
      icon: 'i-lucide-code-2',
      to: '/settings/developer',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Changelog',
      icon: 'i-lucide-list',
      to: '/settings/changelog',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Danger Zone',
      icon: 'i-lucide-trash-2',
      to: '/settings/danger',
      onSelect: () => {
        open.value = false
      }
    }]
  })

  return [primaryLinks]
})

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.value.flat()
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex flex-col w-full">
          <div class="flex items-center gap-2 p-4">
            <div v-if="!collapsed" class="flex items-center gap-2">
              <UIcon name="i-lucide-zap" class="size-6" />
              <span class="font-semibold">Coach Watts</span>
            </div>
            <UIcon v-else name="i-lucide-zap" class="size-6" />
          </div>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
        />
      </template>

      <template #footer="{ collapsed }">
        <div>
          <div v-if="!collapsed" class="px-4 pb-2">
            <div class="flex items-center gap-2">
              <UButton
                to="https://discord.gg/dPYkzg49T9"
                target="_blank"
                color="neutral"
                variant="ghost"
                icon="i-simple-icons-discord"
                size="xs"
                class="flex-1 justify-center"
              >
                Discord
              </UButton>
              <USeparator orientation="vertical" class="h-4" />
              <UButton
                to="https://github.com/newpush/coach"
                target="_blank"
                color="neutral"
                variant="ghost"
                icon="i-simple-icons-github"
                size="xs"
                class="flex-1 justify-center"
              >
                GitHub
              </UButton>
            </div>
            <USeparator class="my-2" />
          </div>

          <div class="p-4 flex items-center gap-3">
            <UAvatar
              v-if="user"
              :alt="user.email || ''"
              size="md"
            />
            <div v-if="!collapsed" class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ impersonatedEmail || user?.email }}</p>
              <UButton
                variant="ghost"
                color="neutral"
                size="xs"
                class="mt-1"
                @click="signOut({ callbackUrl: '/login' })"
              >
                Sign Out
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
