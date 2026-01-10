export default defineEventHandler((event) => {
  // Only apply to /api/oauth routes or generally for dev
  if (event.path.startsWith('/api/oauth') || event.path.startsWith('/api/workouts')) {
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*', // In production, this should be the client URL
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    })

    if (getMethod(event) === 'OPTIONS') {
      return 'OK'
    }
  }
})
