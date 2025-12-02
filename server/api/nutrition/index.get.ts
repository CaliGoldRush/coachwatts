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
    const nutrition = await prisma.nutrition.findMany({
      where: {
        userId: (session.user as any).id
      },
      orderBy: {
        date: 'desc'
      },
      take: limit
    })
    
    return {
      success: true,
      count: nutrition.length,
      nutrition
    }
  } catch (error) {
    console.error('Error fetching nutrition data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch nutrition data'
    })
  }
})