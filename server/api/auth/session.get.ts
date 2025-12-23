import { defineEventHandler } from 'h3'
import { getServerSession } from '../../utils/session'

/**
 * This endpoint overrides the default NextAuth session endpoint
 * to support user impersonation and auth bypass.
 *
 * The session logic is now centralized in server/utils/session.ts
 * which is auto-imported by Nuxt and used by all API endpoints.
 */
export default defineEventHandler(async (event) => {
  return await getServerSession(event)
})
