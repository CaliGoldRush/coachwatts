import { getServerSession } from '../../../utils/session'
import { getUserTimezone, getUserLocalDate } from '../../../utils/date'
import { plannedWorkoutRepository } from '../../../utils/repositories/plannedWorkoutRepository'

defineRouteMeta({
  openAPI: {
    tags: ['Workouts'],
    summary: "Get today's planned workout",
    description: 'Returns the planned workout for the current date.',
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                durationSec: { type: 'number' },
                tss: { type: 'number' },
                type: { type: 'string' },
                structuredWorkout: { type: 'object' }
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

  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const userId = (session.user as any).id

  // Get user's timezone-aware "today" (UTC midnight of their local date)
  const timezone = await getUserTimezone(userId)
  const today = getUserLocalDate(timezone)

  const workouts = await plannedWorkoutRepository.list(userId, {
    where: { date: today },
    limit: 1,
    orderBy: { createdAt: 'desc' }
  })

  // Hack for lte vs lt: use nextDay minus 1 second/ms?
  // Or update repo to support lt/lte distinction.
  // Given current repo implementation, let's update repo to be more flexible or just live with it if we only have daily resolution.
  // Actually, repo uses `lte`.
  // Let's modify the repo to support custom where or update list to use exact date range if needed.
  // Or just use findMany with custom where via a new method `findForDate`.

  return workouts[0] || null
})
