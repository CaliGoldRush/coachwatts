import { getEffectiveUserId } from '../../utils/coaching'

export default defineEventHandler(async (event) => {
  const userId = await getEffectiveUserId(event)
  
  const query = getQuery(event)
  const limit = query.limit ? parseInt(query.limit as string) : undefined
  const startDate = query.startDate ? new Date(query.startDate as string) : undefined
  const endDate = query.endDate ? new Date(query.endDate as string) : undefined
  const includeDuplicates = query.includeDuplicates === 'true'

  const workouts = await workoutRepository.getForUser(userId, {
    startDate,
    endDate,
    limit,
    includeDuplicates,
    include: {
      streams: {
        select: {
          id: true
        }
      }
    }
  })
  
  return workouts
})