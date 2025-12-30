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
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})

  // Helper to fill missing days with 0
  const fillMissingDays = (data: { date: string, count?: number, cost?: number }[], days = 30) => {
    const result = []
    const today = new Date()
    // Normalize today to start of day for comparison if needed, or just use as reference point
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const existing = data.find(item => item.date === dateStr)
      result.push(existing || { date: dateStr, count: 0, cost: 0 })
    }
    return result
  }

  const usersByDay = fillMissingDays(Object.entries(usersByDayMap).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => a.date.localeCompare(b.date)))
  
  const totalUsersLast30Days = usersLast30Days.length

  // Active Users by Day (last 30 days) - based on Session activity + Workouts
  // Note: This is an approximation since sessions can last a long time, but created/updatedAt gives a hint
  // A better metric would be "Daily Active Users" (DAU) based on logins or data uploads
  
  // 1. Get all sessions updated in the last 30 days
  const activeSessions = await prisma.session.findMany({
    where: {
      updatedAt: { gte: thirtyDaysAgo }
    },
    select: {
      userId: true,
      updatedAt: true
    }
  })

  // 2. Get all workouts in the last 30 days (already have this partially, but need userId)
  const activeWorkouts = await prisma.workout.findMany({
    where: {
      date: { gte: thirtyDaysAgo }
    },
    select: {
      userId: true,
      date: true
    }
  })

  // 3. Combine into a "User Activity" map
  const activeUsersByDayMap: Record<string, Set<string>> = {}
  
  // Helper to add to map
  const addToActivityMap = (date: Date, userId: string) => {
    const day = date.toISOString().split('T')[0]
    if (!activeUsersByDayMap[day]) {
      activeUsersByDayMap[day] = new Set()
    }
    activeUsersByDayMap[day].add(userId)
  }

  activeSessions.forEach(s => addToActivityMap(s.updatedAt, s.userId))
  activeWorkouts.forEach(w => addToActivityMap(w.date, w.userId))

  const activeUsersByDay = fillMissingDays(Object.entries(activeUsersByDayMap).map(([date, users]) => ({
    date,
    count: users.size
  })).sort((a, b) => a.date.localeCompare(b.date)))

  const llmUsage = await prisma.llmUsage.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    }
  })
  
  const totalAiCost = llmUsage.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0)
  const totalAiCalls = llmUsage.length
  const successfulAiCalls = llmUsage.filter(u => u.success).length
  const aiSuccessRate = totalAiCalls > 0 ? (successfulAiCalls / totalAiCalls) * 100 : 0
  const avgAiCostPerCall = totalAiCalls > 0 ? totalAiCost / totalAiCalls : 0

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
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})
  
  const workoutsByDay = fillMissingDays(Object.entries(workoutsByDayMap).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => a.date.localeCompare(b.date)))
  
  const avgWorkoutsPerDay = workoutsLast30Days.length / 30

  // AI Cost by day
  const aiCostByDayMap = llmUsage.reduce((acc: Record<string, number>, curr) => {
    const day = curr.createdAt.toISOString().split('T')[0]
    acc[day] = (acc[day] || 0) + (curr.estimatedCost || 0)
    return acc
  }, {})
  
  const aiCostHistory = fillMissingDays(Object.entries(aiCostByDayMap).map(([date, cost]) => ({
    date,
    cost
  })).sort((a, b) => a.date.localeCompare(b.date)))

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
    totalUsersLast30Days
  }
})
