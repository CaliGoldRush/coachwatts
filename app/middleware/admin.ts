export default defineNuxtRouteMiddleware(async (to, from) => {
  const config = useRuntimeConfig()
  
  // Check if auth bypass is enabled
  if (config.public.authBypassEnabled) {
    console.log('[Admin Middleware] Auth bypass enabled, allowing admin access')
    return
  }
  
  const { data } = useAuth()
  
  const user = data.value?.user as any
  if (!user?.isAdmin) {
    return navigateTo('/dashboard')
  }
})
