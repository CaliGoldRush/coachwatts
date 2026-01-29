import { logWebhookRequest, updateWebhookStatus } from '../../../utils/webhook-logger'
import { webhookQueue } from '../../../utils/queue'
import crypto from 'node:crypto'
import { prisma } from '../../../utils/db'

defineRouteMeta({
  openAPI: {
    tags: ['Integrations'],
    summary: 'Polar webhook',
    description: 'Handles incoming webhook notifications from Polar.',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: true
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
  const rawBody = await readRawBody(event)
  const headers = getRequestHeaders(event)
  const signature = headers['polar-webhook-signature']
  const eventType = headers['polar-webhook-event'] // e.g. PING, EXERCISE
  const secret = process.env.POLAR_WEBHOOK_SECRET

  // 1. Validate Signature
  // During creation, we might get a PING before we have the secret.
  // In that case, we should probably allow it if we are expecting it?
  // Or maybe we can't validate it.

  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Missing body' })
  }

  // If we have a secret, we MUST validate.
  if (secret) {
    if (!signature) {
      console.warn('[Polar Webhook] Missing signature header')
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const calculatedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody) // Polar signs the raw body
      .digest('hex') // Polar uses hex? Docs example: "f7bc..." (looks like hex). "toHexString(mac.doFinal...)"

    if (calculatedSignature !== signature) {
      console.warn('[Polar Webhook] Invalid signature')
      // If it's a PING and we might have the wrong secret? No, if we have a secret, it should match.
      await logWebhookRequest({
        provider: 'polar',
        eventType: eventType || 'UNKNOWN',
        headers,
        status: 'FAILED',
        error: 'Invalid signature'
      })
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  } else {
    // No secret configured.
    // If it's a PING, we allow it (assuming we are in setup phase).
    if (eventType === 'PING') {
      console.log('[Polar Webhook] Received PING without configured secret. Allowing for setup.')
    } else {
      console.warn('[Polar Webhook] Received event without configured secret. Ignoring.')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server Configuration Error: POLAR_WEBHOOK_SECRET missing'
      })
    }
  }

  // 2. Parse Body
  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch (e) {
    console.error('[Polar Webhook] Failed to parse JSON body')
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' })
  }

  // 3. Log Receipt
  const log = await logWebhookRequest({
    provider: 'polar',
    eventType: eventType || 'UNKNOWN',
    payload: body,
    headers,
    status: 'PENDING'
  })

  // 4. Handle PING
  if (eventType === 'PING') {
    if (log) await updateWebhookStatus(log.id, 'PROCESSED', 'PING acknowledged')
    return { status: 'OK' }
  }

  // 5. Process Event
  // Polar payload usually contains `user_id` (Polar User ID)
  const polarUserId = body.user_id

  if (!polarUserId) {
    console.warn('[Polar Webhook] Missing user_id in payload')
    if (log) await updateWebhookStatus(log.id, 'FAILED', 'Missing user_id')
    return 'OK'
  }

  // Find Integration
  const integration = await prisma.integration.findFirst({
    where: {
      provider: 'polar',
      externalUserId: String(polarUserId)
    }
  })

  if (!integration) {
    console.warn(`[Polar Webhook] No integration found for user_id: ${polarUserId}`)
    if (log) await updateWebhookStatus(log.id, 'IGNORED', 'User not found')
    return 'OK'
  }

  // 6. Enqueue Job
  try {
    await webhookQueue.add('polar-webhook', {
      provider: 'polar',
      type: eventType,
      userId: integration.userId,
      payload: body,
      logId: log?.id
    })
    if (log) await updateWebhookStatus(log.id, 'QUEUED')
    console.log(`[Polar Webhook] Queued event ${eventType} for user ${integration.userId}`)
  } catch (err: any) {
    console.error('[Polar Webhook] Failed to enqueue job:', err)
    if (log) await updateWebhookStatus(log.id, 'FAILED', 'Queue error')
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
  }

  return 'OK'
})
