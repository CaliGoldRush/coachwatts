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

  // 1. API Keys Stats
  const totalApiKeys = await prisma.apiKey.count()
  const usersWithKeys = await prisma.apiKey
    .groupBy({
      by: ['userId']
    })
    .then((res) => res.length)

  const activeApiKeys = await prisma.apiKey.count({
    where: {
      lastUsedAt: { gte: thirtyDaysAgo }
    }
  })

  // 2. OAuth Apps Stats
  const totalOAuthApps = await prisma.oAuthApp.count()
  const publicOAuthApps = await prisma.oAuthApp.count({
    where: { isPublic: true }
  })
  const developersCount = await prisma.oAuthApp
    .groupBy({
      by: ['ownerId']
    })
    .then((res) => res.length)

  // 3. OAuth Tokens Stats (Active Sessions)
  const totalOAuthTokens = await prisma.oAuthToken.count()
  const activeOAuthTokens = await prisma.oAuthToken.count({
    where: {
      lastUsedAt: { gte: thirtyDaysAgo }
    }
  })

  return {
    apiKeys: {
      total: totalApiKeys,
      activeLast30Days: activeApiKeys,
      uniqueUsers: usersWithKeys
    },
    oauthApps: {
      total: totalOAuthApps,
      public: publicOAuthApps,
      uniqueDevelopers: developersCount
    },
    oauthTokens: {
      total: totalOAuthTokens,
      activeLast30Days: activeOAuthTokens
    }
  }
})
