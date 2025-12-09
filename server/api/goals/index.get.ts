import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        goals: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    return {
      success: true,
      goals: user.goals
    }
  } catch (error) {
    console.error('Error fetching goals:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch goals'
    })
  }
})