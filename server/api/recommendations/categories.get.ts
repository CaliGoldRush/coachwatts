import { getServerSession } from '../../utils/session'
import { prisma } from '../../utils/db'
import { recommendationRepository } from '../../utils/repositories/recommendationRepository'

defineRouteMeta({
  openAPI: {
    tags: ['Recommendations'],
    summary: 'List unique recommendation categories'
  }
})

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user?.email) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw createError({ statusCode: 404, message: 'User not found' })

  const categories = await recommendationRepository.getCategories(user.id)

  return categories.sort()
})
