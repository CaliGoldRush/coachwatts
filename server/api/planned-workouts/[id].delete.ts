import { getServerSession } from '#auth'
import { prisma } from '../../utils/db'
import { deleteIntervalsPlannedWorkout } from '../../utils/intervals'

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
    // Check if workout belongs to user
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
        message: 'Not authorized to delete this workout'
      })
    }
    
    // Get Intervals.icu integration
    const integration = await prisma.integration.findFirst({
      where: {
        userId,
        provider: 'intervals'
      }
    })
    
    // Delete from Intervals.icu if integration exists
    if (integration && workout.externalId) {
      try {
        await deleteIntervalsPlannedWorkout(integration, workout.externalId)
      } catch (error) {
        console.error('Failed to delete from Intervals.icu:', error)
        // Continue with local deletion even if Intervals.icu deletion fails
      }
    }
    
    // Delete the workout from our database
    await prisma.plannedWorkout.delete({
      where: { id: workoutId }
    })
    
    return {
      success: true,
      message: 'Workout deleted successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error deleting planned workout:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to delete planned workout'
    })
  }
})