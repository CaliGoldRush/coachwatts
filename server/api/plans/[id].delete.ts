import { getServerSession } from '../../utils/session'
import { prisma } from '../../utils/db'
import { trainingPlanRepository } from '../../utils/repositories/trainingPlanRepository'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  const userId = (session.user as any).id

  if (!id) throw createError({ statusCode: 400, message: 'Plan ID required' })

  const plan = await trainingPlanRepository.getById(id, userId)

  if (!plan) {
    throw createError({ statusCode: 404, message: 'Plan not found' })
  }

  // Allow deleting DRAFT plans and Templates
  if (plan.status !== 'DRAFT' && !plan.isTemplate) {
    throw createError({
      statusCode: 400,
      message:
        'Only drafts or templates can be permanently deleted. Active plans should be abandoned or archived.'
    })
  }

  // Manual cleanup of AI-managed workouts (Cascade setNull leaves them as orphans)
  await prisma.plannedWorkout.deleteMany({
    where: {
      userId,
      trainingWeek: {
        block: {
          trainingPlanId: id
        }
      },
      managedBy: 'COACH_WATTS'
    }
  })

  await trainingPlanRepository.delete(id, userId)

  return { success: true }
})
