import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const coachId = (session.user as any).id
  return await coachingRepository.getAthletesForCoach(coachId)
})
