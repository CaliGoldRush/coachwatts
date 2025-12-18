import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const coachId = (session.user as any).id
  const { code } = await readBody(event)

  if (!code) {
    throw createError({ statusCode: 400, message: 'Invite code is required' })
  }

  try {
    return await coachingRepository.connectAthleteWithCode(coachId, code)
  } catch (error: any) {
    throw createError({ statusCode: 400, message: error.message })
  }
})
