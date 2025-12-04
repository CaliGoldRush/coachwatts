import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  try {
    const userId = (session.user as any).id
    const wellnessId = event.context.params?.id

    if (!wellnessId) {
      throw createError({
        statusCode: 400,
        message: 'Wellness ID is required'
      })
    }

    const wellness = await prisma.wellness.findUnique({
      where: {
        id: wellnessId
      }
    })

    if (!wellness) {
      throw createError({
        statusCode: 404,
        message: 'Wellness data not found'
      })
    }

    // Verify ownership
    if (wellness.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'Access denied'
      })
    }

    return wellness
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error fetching wellness:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch wellness data'
    })
  }
})