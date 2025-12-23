export default defineNuxtRouteMiddleware((to, from) => {
  const config = useRuntimeConfig()
  
  // Check if auth bypass is enabled
  if (config.public.authBypassEnabled) {
    console.log('[Middleware] Auth bypass enabled, allowing access')
    return
  }
  
  const { status } = useAuth()
  
  if (status.value !== 'authenticated') {
    return navigateTo('/login')
  }
})