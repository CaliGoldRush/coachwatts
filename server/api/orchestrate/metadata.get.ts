import { defineEventHandler, createError } from 'h3'
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
  
  const userEmail = session.user.email
  
  // Get the actual userId from the database
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true }
  })
  
  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }
  
  const userId = user.id
  
  try {
    // Fetch metadata for all tasks
    const [
      workoutStats,
      nutritionStats,
      integrationStats
    ] = await Promise.all([
      // Workout analysis stats
      prisma.workout.findMany({
        where: { userId },
        select: {
          id: true,
          date: true,
          aiAnalysisStatus: true
        },
        orderBy: { date: 'desc' },
        take: 1
      }),
      
      // Nutrition analysis stats
      prisma.nutrition.findMany({
        where: { userId },
        select: {
          id: true,
          date: true,
          aiAnalysisStatus: true
        },
        orderBy: { date: 'desc' },
        take: 1
      }),
      
      // Integration sync times
      prisma.integration.findMany({
        where: { userId },
        select: {
          provider: true,
          lastSyncAt: true
        }
      })
    ])
    
    // Count pending analyses
    const [workoutPendingCount, nutritionPendingCount, totalWorkouts, totalNutrition] = await Promise.all([
      prisma.workout.count({
        where: {
          userId,
          OR: [
            { aiAnalysisStatus: 'PENDING' },
            { aiAnalysisStatus: null }
          ]
        }
      }),
      prisma.nutrition.count({
        where: {
          userId,
          OR: [
            { aiAnalysisStatus: 'PENDING' },
            { aiAnalysisStatus: null }
          ]
        }
      }),
      prisma.workout.count({ where: { userId } }),
      prisma.nutrition.count({ where: { userId } })
    ])
    
    // Build metadata object
    const metadata: Record<string, any> = {}
    
    // Integration metadata
    integrationStats.forEach(int => {
      const taskId = `ingest-${int.provider}`
      metadata[taskId] = {
        lastSync: int.lastSyncAt
      }
    })
    
    // Workout analysis metadata
    metadata['analyze-workouts'] = {
      pendingCount: workoutPendingCount,
      totalCount: totalWorkouts,
      lastSync: workoutStats[0]?.date || null
    }
    
    // Nutrition analysis metadata
    metadata['analyze-nutrition'] = {
      pendingCount: nutritionPendingCount,
      totalCount: totalNutrition,
      lastSync: nutritionStats[0]?.date || null
    }
    
    // Profile generation metadata - check latest athlete profile report
    const lastProfile = await prisma.report.findFirst({
      where: {
        userId,
        type: 'ATHLETE_PROFILE',
        status: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
    
    metadata['generate-athlete-profile'] = {
      lastSync: lastProfile?.createdAt || null
    }
    
    // Workout report metadata
    const lastWorkoutReport = await prisma.report.findFirst({
      where: {
        userId,
        type: 'WEEKLY',
        status: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
    
    metadata['generate-weekly-workout-report'] = {
      lastSync: lastWorkoutReport?.createdAt || null
    }
    
    // Nutrition report metadata (for now, same as workout report)
    metadata['generate-weekly-nutrition-report'] = {
      lastSync: lastWorkoutReport?.createdAt || null
    }
    
    // Plan metadata - check latest plan report
    const lastPlan = await prisma.report.findFirst({
      where: {
        userId,
        type: 'WEEKLY_PLAN',
        status: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
    
    metadata['generate-weekly-plan'] = {
      lastSync: lastPlan?.createdAt || null
    }
    
    // Today's training metadata
    const lastRecommendation = await prisma.activityRecommendation.findFirst({
      where: {
        userId,
        status: 'COMPLETED'
      },
      orderBy: { date: 'desc' },
      select: { date: true }
    })
    
    metadata['generate-daily-recommendations'] = {
      lastSync: lastRecommendation?.date || null
    }
    
    return {
      success: true,
      metadata
    }
  } catch (error: any) {
    console.error('Error fetching task metadata:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch metadata'
    })
  }
})