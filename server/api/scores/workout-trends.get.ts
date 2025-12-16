import { getServerSession } from '#auth'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const query = getQuery(event)
  const days = parseInt(query.days as string) || 30
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  
  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const workouts = await workoutRepository.getForUser(user.id, {
    startDate,
    orderBy: { date: 'asc' }
    // Note: getForUser handles isDuplicate: false by default.
    // Filtering where overallScore is not null is not supported by standard options.
    // However, since we are calculating averages, nulls are handled in the reduce logic anyway (w.overallScore || 0).
    // If strict filtering is required for performance, we should enhance the repository.
    // For now, fetching recent non-duplicate workouts is sufficient.
  })
  
  return {
    workouts,
    summary: {
      total: workouts.length,
      avgOverall: workouts.reduce((sum: number, w) => sum + (w.overallScore || 0), 0) / workouts.length || 0,
      avgTechnical: workouts.reduce((sum: number, w) => sum + (w.technicalScore || 0), 0) / workouts.length || 0,
      avgEffort: workouts.reduce((sum: number, w) => sum + (w.effortScore || 0), 0) / workouts.length || 0,
      avgPacing: workouts.reduce((sum: number, w) => sum + (w.pacingScore || 0), 0) / workouts.length || 0,
      avgExecution: workouts.reduce((sum: number, w) => sum + (w.executionScore || 0), 0) / workouts.length || 0
    }
  }
})