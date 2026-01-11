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

  // 1. Events by Day (Histogram)
  const eventsByDayRaw = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE("createdAt") as date, COUNT(*) as count
    FROM "WebhookLog"
    WHERE "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `

  // Format dates
  const eventsByDay = eventsByDayRaw.map((row) => ({
    date: new Date(row.date).toISOString().split('T')[0],
    count: Number(row.count)
  }))

  // 2. Status Counts
  const statusCounts = await prisma.webhookLog.groupBy({
    by: ['status'],
    _count: { id: true },
    where: { createdAt: { gte: thirtyDaysAgo } }
  })

  // 3. Provider Counts
  const providerCounts = await prisma.webhookLog.groupBy({
    by: ['provider'],
    _count: { id: true },
    where: { createdAt: { gte: thirtyDaysAgo } }
  })

  // 4. Recent Failures
  const recentFailures = await prisma.webhookLog.findMany({
    where: {
      status: 'FAILED',
      createdAt: { gte: thirtyDaysAgo }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      provider: true,
      eventType: true,
      error: true,
      createdAt: true
    }
  })

  return {
    eventsByDay,
    statusCounts: statusCounts
      .map((s) => ({ status: s.status, count: s._count.id }))
      .sort((a, b) => b.count - a.count),
    providerCounts: providerCounts
      .map((p) => ({ provider: p.provider, count: p._count.id }))
      .sort((a, b) => b.count - a.count),
    recentFailures
  }
})
