import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user) {
    throw createError({ 
      statusCode: 401,
      message: 'Unauthorized' 
    })
  }
  
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Nutrition ID is required'
    })
  }
  
  const nutrition = await nutritionRepository.getById(id, (session.user as any).id)
  
  if (!nutrition) {
    throw createError({
      statusCode: 404,
      message: 'Nutrition entry not found'
    })
  }
  
  // Format date to avoid timezone issues
  return {
    ...nutrition,
    date: nutrition.date.toISOString().split('T')[0] // YYYY-MM-DD format
  }
})