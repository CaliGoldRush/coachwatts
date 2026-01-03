import { defineEventHandler, createError } from 'h3'
import { getServerSession } from '../../utils/session'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  // Strict admin check
  if (!session?.user?.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

  // Basic totals
  const totalUsers = await prisma.user.count()
  const totalWorkouts = await prisma.workout.count()
  
  // AI Costs & Usage (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Users by day (last 30 days)
  const usersLast30Days = await prisma.user.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    },
    select: {
      createdAt: true
    }
  })

  const usersByDayMap = usersLast30Days.reduce((acc: Record<string, number>, curr) => {
    const day = curr.createdAt.toISOString().split('T')[0]
    if (day) {
      acc[day] = (acc[day] || 0) + 1
    }
    return acc
  }, {})

  // Workouts by day (last 30 days)
  const workoutsLast30Days = await prisma.workout.findMany({
    where: {
      date: { gte: thirtyDaysAgo }
    },
    select: {
      date: true
    }
  })

  const workoutsByDayMap = workoutsLast30Days.reduce((acc: Record<string, number>, curr) => {
    const day = curr.date.toISOString().split('T')[0]
    if (day) {
      acc[day] = (acc[day] || 0) + 1
    }
    return acc
  }, {})

  // AI Usage Stats (last 30 days)
  const llmUsage = await prisma.llmUsage.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    }
  })

  const totalAiCost = llmUsage.reduce((sum, curr) => sum + (curr.estimatedCost || 0), 0)
  const totalAiCalls = llmUsage.length
  const successfulAiCalls = llmUsage.filter(l => l.success).length
  const aiSuccessRate = totalAiCalls > 0 ? (successfulAiCalls / totalAiCalls) * 100 : 100
  const avgAiCostPerCall = totalAiCalls > 0 ? totalAiCost / totalAiCalls : 0

  const aiCostByDayMap = llmUsage.reduce((acc: Record<string, number>, curr) => {
    const day = curr.createdAt.toISOString().split('T')[0]
    if (day) {
      acc[day] = (acc[day] || 0) + (curr.estimatedCost || 0)
    }
    return acc
  }, {})

  interface StatResult {
    date: string
    count?: number
    cost?: number
  }

  const fillMissingDays = (data: Record<string, number>, type: 'count' | 'cost' = 'count', days = 30): StatResult[] => {
    const result: StatResult[] = []
    const today = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      if (dateStr) {
        result.push({
          date: dateStr,
          [type]: data[dateStr] || 0
        })
      }
    }
    return result
  }

  const workoutsByDay = fillMissingDays(workoutsByDayMap, 'count')
  const usersByDay = fillMissingDays(usersByDayMap, 'count')
  const aiCostHistory = fillMissingDays(aiCostByDayMap, 'cost')

  // Active users (users who logged a workout in last 30 days)
  const activeUsersLast30DaysCount = await prisma.workout.count({
    where: {
      date: { gte: thirtyDaysAgo }
    }
  })

  const activeUsersByDay: StatResult[] = [] // Placeholder or implement if needed

  const totalUsersLast30Days = usersLast30Days.length
  const avgWorkoutsPerDay = workoutsLast30Days.length / 30

  return {
    totalUsers,
    totalWorkouts,
    totalAiCost,
    totalAiCalls,
    aiSuccessRate,
    avgAiCostPerCall,
    workoutsByDay,
    avgWorkoutsPerDay,
    aiCostHistory,
    usersByDay,
    activeUsersByDay,
    totalUsersLast30Days
  }
})
