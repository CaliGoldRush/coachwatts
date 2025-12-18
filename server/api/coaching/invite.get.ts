import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const athleteId = (session.user as any).id
  const invite = await coachingRepository.getActiveInvite(athleteId)
  
  return invite || { status: 'NONE' }
})
