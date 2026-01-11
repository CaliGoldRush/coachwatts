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

  // 1. Integrations Stats
  const integrations = await prisma.integration.groupBy({
    by: ['provider'],
    _count: {
      userId: true
    }
  })

  // 2. Sharing Stats
  const shares = await prisma.shareToken.groupBy({
    by: ['resourceType'],
    _count: {
      id: true
    }
  })
  const totalShares = shares.reduce((acc, curr) => acc + curr._count.id, 0)

  // 3. User Activity / Churn
  // Active in last 30 days (logged a workout)
  const activeUsersCount = await prisma.workout
    .groupBy({
      by: ['userId'],
      where: {
        date: { gte: thirtyDaysAgo }
      }
    })
    .then((res) => res.length)

  const totalUsers = await prisma.user.count()
  const inactiveUsers = totalUsers - activeUsersCount
  const retentionRate = totalUsers > 0 ? (activeUsersCount / totalUsers) * 100 : 0

  // 4. New Users History (Reused from main stats but specific here if needed detailed)
  // We can skip detailed histogram if the main hub has it, but let's provide a breakdown of authentication providers
  const authProviders = await prisma.account.groupBy({
    by: ['provider'],
    _count: {
      userId: true
    }
  })

  // 5. Daily Histograms (Last 30 Days)
  // New Users
  const usersByDayRaw = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE("createdAt") as date, COUNT(*) as count
    FROM "User"
    WHERE "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `

  // Active Users (unique users per day who logged a workout)
  const activeUsersByDayRaw = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE("date") as date, COUNT(DISTINCT "userId") as count
    FROM "Workout"
    WHERE "date" >= ${thirtyDaysAgo}
    GROUP BY DATE("date")
    ORDER BY date ASC
  `

  // Formatting helpers
  const mapToRecord = (rows: any[], valKey: string) => {
    return rows.reduce(
      (acc, row) => {
        const d = new Date(row.date).toISOString().split('T')[0]
        if (d) {
          acc[d] = Number(row[valKey] || 0)
        }
        return acc
      },
      {} as Record<string, number>
    )
  }

  const fillMissingDays = (data: Record<string, number>, days = 30) => {
    const result: { date: string; count: number }[] = []
    const today = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      if (dateStr) {
        result.push({
          date: dateStr,
          count: data[dateStr] || 0
        })
      }
    }
    return result
  }

  const usersByDay = fillMissingDays(mapToRecord(usersByDayRaw, 'count'))
  const activeUsersByDay = fillMissingDays(mapToRecord(activeUsersByDayRaw, 'count'))

  return {
    integrations: integrations
      .map((i) => ({ provider: i.provider, count: i._count.userId }))
      .sort((a, b) => b.count - a.count),
    sharing: {
      total: totalShares,
      byType: shares
        .map((s) => ({ type: s.resourceType, count: s._count.id }))
        .sort((a, b) => b.count - a.count)
    },
    activity: {
      activeLast30Days: activeUsersCount,
      totalUsers,
      inactiveUsers,
      retentionRate,
      usersByDay,
      activeUsersByDay
    },
    authProviders: authProviders.map((p) => ({ provider: p.provider, count: p._count.userId }))
  }
})
