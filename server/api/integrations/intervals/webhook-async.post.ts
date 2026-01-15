import { webhookQueue } from '../../../utils/queue'
import { logWebhookRequest, updateWebhookStatus } from '../../../utils/webhook-logger'

defineRouteMeta({
  openAPI: {
    tags: ['Integrations'],
    summary: 'Intervals.icu async webhook',
    description:
      'Handles incoming webhook notifications from Intervals.icu asynchronously via Redis queue.',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              secret: { type: 'string' },
              events: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    athlete_id: { type: 'string' },
                    type: { type: 'string' },
                    timestamp: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const secret = process.env.INTERVALS_WEBHOOK_SECRET
  const body = await readBody(event)
  const headers = getRequestHeaders(event)

  // Log receipt
  const log = await logWebhookRequest({
    provider: 'intervals',
    eventType: body?.events?.[0]?.type || 'UNKNOWN',
    payload: body,
    headers,
    status: 'PENDING'
  })

  if (!body || body.secret !== secret) {
    console.warn('[Intervals Webhook Async] Unauthorized or missing secret')
    if (log) await updateWebhookStatus(log.id, 'FAILED', 'Unauthorized: Invalid secret')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid secret'
    })
  }

  const events = body.events || []
  console.log(`[Intervals Webhook Async] Received ${events.length} events`)

  try {
    // Enqueue jobs
    let queuedCount = 0
    for (const intervalEvent of events) {
      const { athlete_id, type } = intervalEvent

      if (!athlete_id) continue

      // Verification step - ensure user exists
      const integration = await prisma.integration.findFirst({
        where: {
          provider: 'intervals',
          externalUserId: athlete_id.toString()
        }
      })

      if (!integration) {
        console.warn(`[Intervals Webhook Async] No integration found for athlete_id: ${athlete_id}`)
        continue
      }

      const userId = integration.userId

      await webhookQueue.add('intervals-webhook', {
        provider: 'intervals',
        type,
        userId,
        event: intervalEvent,
        logId: log?.id // Passing logId for tracing/debugging in worker logs
      })
      queuedCount++
    }

    if (log) await updateWebhookStatus(log.id, 'QUEUED', `Queued ${queuedCount} events`)
  } catch (error: any) {
    console.error('[Intervals Webhook Async] Failed to queue events:', error)
    if (log) await updateWebhookStatus(log.id, 'FAILED', error.message || 'Queueing failed')
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }

  return 'OK'
})
