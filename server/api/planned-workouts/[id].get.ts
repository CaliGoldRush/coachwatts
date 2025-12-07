import { getServerSession } from '#auth'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
  
  const userId = (session.user as any).id
  const workoutId = event.context.params?.id
  
  if (!workoutId) {
    throw createError({
      statusCode: 400,
      message: 'Workout ID is required'
    })
  }
  
  try {
    const workout = await prisma.plannedWorkout.findUnique({
      where: { id: workoutId }
    })
    
    if (!workout) {
      throw createError({
        statusCode: 404,
        message: 'Workout not found'
      })
    }
    
    if (workout.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'Not authorized to view this workout'
      })
    }
    
    return workout
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error fetching planned workout:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch planned workout'
    })
  }
})