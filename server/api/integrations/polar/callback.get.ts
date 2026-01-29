import { getServerSession } from '../../../utils/session'
import { prisma } from '../../../utils/db'

defineRouteMeta({
  openAPI: {
    tags: ['Integrations'],
    summary: 'Polar callback',
    description: 'Handles the OAuth callback from Polar.',
    parameters: [
      { name: 'code', in: 'query', schema: { type: 'string' } },
      { name: 'state', in: 'query', schema: { type: 'string' } },
      { name: 'error', in: 'query', schema: { type: 'string' } }
    ],
    responses: {
      302: { description: 'Redirect to settings' },
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

  const query = getQuery(event)
  const code = query.code as string
  const state = query.state as string
  const error = query.error as string

  if (error) {
    console.error('Polar OAuth error:', error)
    return sendRedirect(event, '/settings?polar_error=' + encodeURIComponent(error))
  }

  // Verify state parameter for CSRF protection
  const storedState = getCookie(event, 'polar_oauth_state')
  if (!state || !storedState || state !== storedState) {
    console.error('Polar OAuth state mismatch')
    // Clear the state cookie
    deleteCookie(event, 'polar_oauth_state')
    return sendRedirect(event, '/settings?polar_error=invalid_state')
  }

  // Clear the state cookie after validation
  deleteCookie(event, 'polar_oauth_state')

  if (!code) {
    return sendRedirect(event, '/settings?polar_error=no_code')
  }

  try {
    const config = useRuntimeConfig()
    const clientId = process.env.POLAR_CLIENT_ID
    const clientSecret = process.env.POLAR_CLIENT_SECRET
    const redirectUri = `${config.public.siteUrl || 'http://localhost:3099'}/api/integrations/polar/callback`

    if (!clientId || !clientSecret) {
      throw new Error('Polar credentials not configured')
    }

    const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://polarremote.com/v2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: authHeader
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString()
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Polar token exchange failed:', errorText)
      throw new Error('Failed to exchange authorization code')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in
    const polarUserId = tokenData.x_user_id

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      })
    }

    // Register User with Polar
    // This connects the Polar User to our Member ID
    const { registerPolarUser } = await import('../../../utils/polar')

    try {
      await registerPolarUser(accessToken, user.id)
      console.log(`Registered Polar user for ${user.id}`)
    } catch (e: any) {
      if (e.message !== 'User already registered') {
        console.error('Failed to register Polar user:', e)
        throw new Error('Failed to register user with Polar')
      }
      console.log(`Polar user for ${user.id} was already registered.`)
    }

    // Check if integration already exists
    const existing = await prisma.integration.findFirst({
      where: {
        userId: user.id,
        provider: 'polar'
      }
    })

    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    if (existing) {
      // Update existing integration
      await prisma.integration.update({
        where: { id: existing.id },
        data: {
          accessToken,
          externalUserId: String(polarUserId),
          expiresAt,
          lastSyncAt: new Date(),
          syncStatus: 'SUCCESS',
          errorMessage: null
        }
      })
    } else {
      // Create new integration
      await prisma.integration.create({
        data: {
          userId: user.id,
          provider: 'polar',
          accessToken,
          externalUserId: String(polarUserId),
          expiresAt,
          syncStatus: 'SUCCESS',
          lastSyncAt: new Date(),
          ingestWorkouts: true // Default to true
        }
      })
    }

    // Trigger initial ingestion?
    // We can trigger the background job here if we want immediate sync.
    // For now, we rely on the scheduled job or user manual sync.
    // Or we can trigger it.
    // trigger.invoke('ingest-polar', { userId: user.id }) ?

    // Redirect back to settings with success message
    return sendRedirect(event, '/settings?polar_success=true')
  } catch (error: any) {
    console.error('Failed to connect Polar:', error)
    return sendRedirect(
      event,
      '/settings?polar_error=' + encodeURIComponent(error.message || 'connection_failed')
    )
  }
})
