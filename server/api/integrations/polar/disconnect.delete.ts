import { getServerSession } from '../../../utils/session'
import { prisma } from '../../../utils/db'
import { deRegisterPolarUser } from '../../../utils/polar'

defineRouteMeta({
  openAPI: {
    tags: ['Integrations'],
    summary: 'Disconnect Polar',
    description: 'Disconnects the Polar integration for the authenticated user.',
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      401: { description: 'Unauthorized' },
      404: { description: 'Integration not found' }
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

  try {
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

    // Find the integration
    const integration = await prisma.integration.findFirst({
      where: {
        userId: user.id,
        provider: 'polar'
      }
    })

    if (!integration) {
      throw createError({
        statusCode: 404,
        message: 'Polar integration not found'
      })
    }

    // De-register from Polar
    if (integration.externalUserId && integration.accessToken) {
      try {
        await deRegisterPolarUser(integration.accessToken, integration.externalUserId)
      } catch (e) {
        console.error('Failed to de-register from Polar (continuing with local deletion):', e)
      }
    }

    // Delete the integration
    await prisma.integration.delete({
      where: { id: integration.id }
    })

    return {
      success: true,
      message: 'Polar disconnected successfully'
    }
  } catch (error: any) {
    console.error('Failed to disconnect Polar:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to disconnect Polar'
    })
  }
})
