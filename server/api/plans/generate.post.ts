import { getServerSession } from '#auth'
import { tasks } from '@trigger.dev/sdk/v3'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user) {
    throw createError({ 
      statusCode: 401,
      message: 'Unauthorized' 
    })
  }
  
  const userId = (session.user as any).id
  const body = await readBody(event)
  
  // Default to 7 days if not specified
  const daysToPlann = body.days || 7
  const startDate = body.startDate ? new Date(body.startDate) : new Date()
  
  // Trigger the plan generation job with per-user concurrency
  const handle = await tasks.trigger('generate-weekly-plan', {
    userId,
    startDate,
    daysToPlann
  }, {
    concurrencyKey: userId
  })
  
  return {
    success: true,
    jobId: handle.id,
    message: `Generating ${daysToPlann}-day training plan`
  }
})