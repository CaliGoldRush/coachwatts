import { getServerSession } from '#auth'
import { prisma } from '../../utils/db'
import { createIntervalsPlannedWorkout } from '../../utils/intervals'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
  
  const userId = (session.user as any).id
  const body = await readBody(event)
  
  // Validate required fields
  if (!body.date || !body.title) {
    throw createError({
      statusCode: 400,
      message: 'Date and title are required'
    })
  }
  
  try {
    // Get Intervals.icu integration
    const integration = await prisma.integration.findFirst({
      where: {
        userId,
        provider: 'intervals'
      }
    })
    
    if (!integration) {
      throw createError({
        statusCode: 400,
        message: 'Intervals.icu integration not found. Please connect your account first.'
      })
    }
    
    // Create the workout in Intervals.icu
    const intervalsWorkout = await createIntervalsPlannedWorkout(integration, {
      date: new Date(body.date),
      title: body.title,
      description: body.description,
      type: body.type || 'Ride',
      durationSec: body.durationSec,
      tss: body.tss
    })
    
    // Create planned workout in our database with the Intervals.icu ID
    const plannedWorkout = await prisma.plannedWorkout.create({
      data: {
        userId,
        externalId: String(intervalsWorkout.id),
        date: new Date(body.date),
        title: body.title,
        description: body.description || '',
        type: body.type || 'Ride',
        durationSec: body.durationSec || 3600,
        tss: body.tss,
        completed: false,
        rawJson: intervalsWorkout
      }
    })
    
    return {
      success: true,
      workout: plannedWorkout
    }
  } catch (error: any) {
    console.error('Error creating planned workout:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create planned workout'
    })
  }
})