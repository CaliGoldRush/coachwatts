import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const athleteId = (session.user as any).id
  const coachId = getRouterParam(event, 'id')

  if (!coachId) {
    throw createError({ statusCode: 400, message: 'Coach ID is required' })
  }

  return await coachingRepository.removeRelationship(coachId, athleteId)
})
