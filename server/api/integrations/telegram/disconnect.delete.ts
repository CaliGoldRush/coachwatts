import { getServerSession } from '../../../utils/session'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const userId = (session.user as any).id

  // Delete the Telegram integration
  await prisma.integration.deleteMany({
    where: {
      userId,
      provider: 'telegram'
    }
  })

  // Optionally delete the Telegram Chat Room?
  // Better to keep it but rename it or just leave it.
  // For now, just unlinking the account is enough.

  return { success: true }
})
