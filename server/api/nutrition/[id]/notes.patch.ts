import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const nutritionId = getRouterParam(event, 'id')
  if (!nutritionId) {
    throw createError({
      statusCode: 400,
      message: 'Nutrition ID is required'
    })
  }

  const body = await readBody(event)
  const { notes } = body

  if (typeof notes !== 'string' && notes !== null) {
    throw createError({
      statusCode: 400,
      message: 'Notes must be a string or null'
    })
  }

  // Verify the nutrition entry belongs to the user
  const nutrition = await nutritionRepository.getById(nutritionId, (session.user as any).id)

  if (!nutrition) {
    throw createError({
      statusCode: 404,
      message: 'Nutrition entry not found'
    })
  }

  // Update the nutrition notes
  const updatedNutrition = await nutritionRepository.update(nutritionId, {
    notes: notes,
    notesUpdatedAt: new Date()
  })

  return {
    success: true,
    nutrition: updatedNutrition
  }
})