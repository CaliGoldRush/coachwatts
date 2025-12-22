import { getServerSession } from '#auth'
import { prisma } from '../../utils/db'

defineRouteMeta({
  openAPI: {
    tags: ['Goals'],
    summary: 'Update goal',
    description: 'Updates a specific goal by ID.',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' }
      }
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              currentValue: { type: 'number' },
              status: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'ARCHIVED'] },
              targetDate: { type: 'string', format: 'date-time' },
              targetValue: { type: 'number' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                goal: { type: 'object' }
              }
            }
          }
        }
      },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
      404: { description: 'Goal not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user) {
    throw createError({ 
      statusCode: 401,
      message: 'Unauthorized' 
    })
  }
  
  const userId = (session.user as any).id
  const id = event.context.params?.id
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Goal ID is required'
    })
  }
  
  // Verify the goal belongs to this user
  const existingGoal = await prisma.goal.findUnique({
    where: { id },
    select: { userId: true }
  })
  
  if (!existingGoal) {
    throw createError({
      statusCode: 404,
      message: 'Goal not found'
    })
  }
  
  if (existingGoal.userId !== userId) {
    throw createError({
      statusCode: 403,
      message: 'Not authorized to edit this goal'
    })
  }
  
  const body = await readBody(event)
  
  // Convert date strings to Date objects for Prisma
  const data: any = { ...body }
  if (data.targetDate && typeof data.targetDate === 'string') {
    data.targetDate = new Date(data.targetDate)
  }
  if (data.eventDate && typeof data.eventDate === 'string') {
    data.eventDate = new Date(data.eventDate)
  }
  data.updatedAt = new Date()
  
  try {
    const goal = await prisma.goal.update({
      where: { id },
      data
    })
    
    return {
      success: true,
      goal
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to update goal: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})