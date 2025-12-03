import { getServerSession } from '#auth'
import { tasks } from "@trigger.dev/sdk/v3";

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
  const reportType = body.type || 'WEEKLY_ANALYSIS'
  
  // Validate report type
  const validTypes = ['WEEKLY_ANALYSIS', 'LAST_3_WORKOUTS', 'LAST_3_NUTRITION', 'LAST_7_NUTRITION']
  if (!validTypes.includes(reportType)) {
    throw createError({
      statusCode: 400,
      message: `Invalid report type. Must be one of: ${validTypes.join(', ')}`
    })
  }
  
  // Determine date range based on report type
  let dateRangeStart: Date
  let dateRangeEnd = new Date()
  
  if (reportType === 'LAST_3_WORKOUTS') {
    // For last 3 workouts, we'll use a 30-day lookback to find them
    dateRangeStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  } else if (reportType === 'LAST_3_NUTRITION') {
    // For last 3 nutrition days
    dateRangeStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  } else if (reportType === 'LAST_7_NUTRITION') {
    // For last 7 nutrition days
    dateRangeStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  } else {
    // WEEKLY_ANALYSIS uses 7 days (previous week)
    dateRangeStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
  
  // Create report record
  const report = await prisma.report.create({
    data: {
      userId,
      type: reportType,
      status: 'PENDING',
      dateRangeStart,
      dateRangeEnd
    }
  })
  
  try {
    // Trigger appropriate background job based on report type
    let handle
    if (reportType === 'LAST_3_WORKOUTS') {
      handle = await tasks.trigger('analyze-last-3-workouts', {
        userId,
        reportId: report.id
      })
    } else if (reportType === 'LAST_3_NUTRITION') {
      handle = await tasks.trigger('analyze-last-3-nutrition', {
        userId,
        reportId: report.id
      })
    } else if (reportType === 'LAST_7_NUTRITION') {
      handle = await tasks.trigger('analyze-last-7-nutrition', {
        userId,
        reportId: report.id
      })
    } else {
      handle = await tasks.trigger('generate-weekly-report', {
        userId,
        reportId: report.id
      })
    }
    
    return {
      success: true,
      reportId: report.id,
      reportType,
      jobId: handle.id,
      message: 'Report generation started'
    }
  } catch (error) {
    // Update report status to failed
    await prisma.report.update({
      where: { id: report.id },
      data: { status: 'FAILED' }
    })
    
    throw createError({
      statusCode: 500,
      message: `Failed to trigger report generation: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})