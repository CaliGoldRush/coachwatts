import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user) {
    throw createError({ 
      statusCode: 401,
      message: 'Unauthorized' 
    })
  }
  
  const query = getQuery(event)
  const limit = query.limit ? parseInt(query.limit as string) : 30
  
  try {
    const nutrition = await nutritionRepository.getForUser((session.user as any).id, {
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