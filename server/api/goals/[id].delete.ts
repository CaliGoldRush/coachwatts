import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
  
  const id = event.context.params?.id
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Goal ID required'
    })
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    // Check if goal belongs to user
    const goal = await prisma.goal.findUnique({
      where: { id }
    })
    
    if (!goal || goal.userId !== user.id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Goal not found'
      })
    }
    
    await prisma.goal.delete({
      where: { id }
    })
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Error deleting goal:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete goal'
    })
  }
})