import { getServerSession } from '../../../utils/session'

defineRouteMeta({
  openAPI: {
    tags: ['Integrations'],
    summary: 'Authorize Polar',
    description: 'Initiates the OAuth flow for Polar integration. Redirects to Polar.',
    responses: {
      302: { description: 'Redirect to Polar' },
      401: { description: 'Unauthorized' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)

  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const config = useRuntimeConfig()
  const clientId = process.env.POLAR_CLIENT_ID
  const redirectUri = `${config.public.siteUrl || 'http://localhost:3099'}/api/integrations/polar/callback`

  if (!clientId) {
    throw createError({
      statusCode: 500,
      message: 'Polar client ID not configured'
    })
  }

  // Generate a random state parameter for CSRF protection
  const state =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  // Store state in a secure cookie
  setCookie(event, 'polar_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/'
  })

  // Build Polar OAuth authorization URL
  const authUrl = new URL('https://flow.polar.com/oauth2/authorization')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'accesslink.read_all')
  authUrl.searchParams.set('state', state)

  // Redirect to Polar authorization page
  return sendRedirect(event, authUrl.toString())
})
