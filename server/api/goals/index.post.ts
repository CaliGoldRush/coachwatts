import { getServerSession } from '#auth'
import { z } from 'zod'

const goalSchema = z.object({
  type: z.enum(['BODY_COMPOSITION', 'EVENT', 'PERFORMANCE', 'CONSISTENCY']),
  title: z.string(),
  description: z.string().optional(),
  targetDate: z.string().optional(), // ISO string
  eventDate: z.string().optional(), // ISO string
  eventType: z.string().optional(),
  metric: z.string().optional(),
  targetValue: z.number().optional(),
  startValue: z.number().optional(),
  currentValue: z.number().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM')
})

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
  
  const body = await readBody(event)
  const result = goalSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.errors
    })
  }
  
  const data = result.data
  
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
    
    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        type: data.type,
        title: data.title,
        description: data.description,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        eventType: data.eventType,
        metric: data.metric,
        targetValue: data.targetValue,
        startValue: data.startValue,
        currentValue: data.currentValue || data.startValue,
        priority: data.priority,
        // AI Context prompt could be generated here or later
        aiContext: `Goal: ${data.title}. Type: ${data.type}.`
      }
    })
    
    return {
      success: true,
      goal
    }
  } catch (error: any) {
    console.error('Error creating goal:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create goal',
      message: error.message
    })
  }
})