import { getServerSession } from '#auth'
import { runs } from '@trigger.dev/sdk/v3'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user) {
    throw createError({ 
      statusCode: 401,
      message: 'Unauthorized' 
    })
  }
  
  const query = getQuery(event)
  const jobId = query.jobId as string
  
  if (!jobId) {
    throw createError({
      statusCode: 400,
      message: 'Job ID is required'
    })
  }
  
  try {
    // Get the run status and output
    const run = await runs.retrieve(jobId)
    
    return {
      status: run.status,
      output: run.output,
      isCompleted: run.status === 'COMPLETED',
      isFailed: run.status === 'FAILED'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to retrieve review: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})