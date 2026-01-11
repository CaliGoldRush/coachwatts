import { defineEventHandler, createError } from 'h3'
import { getServerSession } from '../../../utils/session'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)

  if (!session?.user?.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // 1. Workouts by Day (already in main stats, but good to have detailed here if we add type filtering later)
  // For now, let's reuse the raw query for efficiency
  const workoutsByDayRaw = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE("date") as date, COUNT(*) as count
    FROM "Workout"
    WHERE "date" >= ${thirtyDaysAgo}
    GROUP BY DATE("date")
    ORDER BY date ASC
  `

  const workoutsByDay = workoutsByDayRaw.map((row) => ({
    date: new Date(row.date).toISOString().split('T')[0],
    count: Number(row.count)
  }))

  // 2. Workouts by Type
  const workoutsByType = await prisma.workout.groupBy({
    by: ['type'],
    _count: { id: true }
  })

  // 3. Workouts by Source
  const workoutsBySource = await prisma.workout.groupBy({
    by: ['source'],
    _count: { id: true }
  })

  // 4. Duplicate Stats
  const duplicateStats = await prisma.workout.groupBy({
    by: ['isDuplicate'],
    _count: { id: true }
  })

  // 5. Global Aggregates (All time or last 30 days? Let's do All Time for "Big Numbers")
  const globalStats = await prisma.workout.aggregate({
    _sum: {
      distanceMeters: true,
      durationSec: true,
      tss: true,
      kilojoules: true
    },
    _count: {
      id: true
    }
  })

  // 6. AI Analysis Coverage
  const aiAnalysisCount = await prisma.workout.count({
    where: {
      aiAnalysisStatus: 'COMPLETED'
    }
  })

  return {
    workoutsByDay,
    workoutsByType: workoutsByType
      .map((t) => ({ type: t.type || 'Unknown', count: t._count.id }))
      .sort((a, b) => b.count - a.count),
    workoutsBySource: workoutsBySource
      .map((s) => ({ source: s.source, count: s._count.id }))
      .sort((a, b) => b.count - a.count),
    duplicates: {
      total: duplicateStats.reduce((acc, curr) => acc + curr._count.id, 0),
      duplicates: duplicateStats.find((d) => d.isDuplicate)?._count.id || 0
    },
    global: {
      totalWorkouts: globalStats._count.id,
      totalDistanceKm: (globalStats._sum.distanceMeters || 0) / 1000,
      totalDurationHours: (globalStats._sum.durationSec || 0) / 3600,
      totalTss: globalStats._sum.tss || 0,
      totalKj: globalStats._sum.kilojoules || 0
    },
    aiCoverage: {
      total: globalStats._count.id,
      analyzed: aiAnalysisCount,
      percentage: globalStats._count.id > 0 ? (aiAnalysisCount / globalStats._count.id) * 100 : 0
    }
  }
})
