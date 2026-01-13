import { getUserTimezone, getUserLocalDate } from '../../utils/date'
import { dailyCheckinRepository } from '../../utils/repositories/dailyCheckinRepository'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const userId = session.user.id
  const timezone = await getUserTimezone(userId)
  const today = getUserLocalDate(timezone)

  const checkin = await dailyCheckinRepository.getByDate(userId, today)

  return checkin
})
