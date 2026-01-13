import { getServerSession } from '../../utils/session'
import { prisma } from '../../utils/db'
import { recommendationRepository } from '../../utils/repositories/recommendationRepository'

defineRouteMeta({
  openAPI: {
    tags: ['Recommendations'],
    summary: 'List recommendations',
    parameters: [
      {
        name: 'status',
        in: 'query',
        schema: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'DISMISSED', 'ALL'] }
      },
      { name: 'isPinned', in: 'query', schema: { type: 'boolean' } },
      { name: 'metric', in: 'query', schema: { type: 'string' } },
      { name: 'category', in: 'query', schema: { type: 'string' } },
      { name: 'sourceType', in: 'query', schema: { type: 'string' } },
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
    ]
  }
})

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user?.email) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const status = query.status as string | undefined
  const isPinned = query.isPinned === 'true'
  const metric = query.metric as string | undefined
  const category = query.category as string | undefined
  const sourceType = query.sourceType as string | undefined
  const limit = parseInt(query.limit as string) || 50

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw createError({ statusCode: 404, message: 'User not found' })

  const recommendations = await recommendationRepository.list(user.id, {
    status,
    isPinned: query.isPinned !== undefined ? isPinned : undefined,
    metric,
    category,
    sourceType,
    limit
  })

  return recommendations
})
