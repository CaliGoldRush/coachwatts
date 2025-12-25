import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const userId = session.user.id
  const now = new Date()

  // Delete all future, uncompleted planned workouts
  const result = await prisma.plannedWorkout.deleteMany({
    where: {
      userId,
      date: {
        gt: now
      },
      completed: false
    }
  })

  return {
    success: true,
    count: result.count
  }
})
