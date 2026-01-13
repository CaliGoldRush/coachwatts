import { getServerSession } from '../../utils/session'
import { prisma } from '../../utils/db'
import { recommendationRepository } from '../../utils/repositories/recommendationRepository'

defineRouteMeta({
  openAPI: {
    tags: ['Recommendations'],
    summary: 'Clear all recommendations',
    description: 'Deletes all recommendations for the authenticated user.',
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                count: { type: 'integer' }
              }
            }
          }
        }
      },
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

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  const deleted = await recommendationRepository.clearAll(user.id)

  return {
    success: true,
    count: deleted.count
  }
})
