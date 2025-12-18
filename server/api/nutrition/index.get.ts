import { getEffectiveUserId } from '../../utils/coaching'

export default defineEventHandler(async (event) => {
  const userId = await getEffectiveUserId(event)
  
  const query = getQuery(event)
  const limit = query.limit ? parseInt(query.limit as string) : 30
  
  try {
    const nutrition = await nutritionRepository.getForUser(userId, {
      limit,
      orderBy: { date: 'desc' }
    })
    
    // Format dates to avoid timezone issues
    const formattedNutrition = nutrition.map(n => ({
      ...n,
      date: n.date.toISOString().split('T')[0] // YYYY-MM-DD format
    }))
    
    return {
      success: true,
      count: formattedNutrition.length,
      nutrition: formattedNutrition
    }
  } catch (error) {
    console.error('Error fetching nutrition data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch nutrition data'
    })
  }
})