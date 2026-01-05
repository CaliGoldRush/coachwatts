import { prisma } from './db'

export async function logWebhookRequest(data: {
  provider: string
  eventType?: string
  payload?: any
  headers?: any
  query?: any
  status?: string
  error?: string
}) {
  try {
    return await prisma.webhookLog.create({
      data: {
        provider: data.provider,
        eventType: data.eventType,
        payload: data.payload,
        headers: data.headers,
        query: data.query,
        status: data.status || 'PENDING',
        error: data.error
      }
    })
  } catch (err) {
    // Fail silently so we don't break the webhook response if logging fails
    console.error('Failed to log webhook:', err)
    return null
  }
}

export async function updateWebhookStatus(id: string, status: string, error?: string) {
  if (!id) return

  try {
    await prisma.webhookLog.update({
      where: { id },
      data: {
        status,
        error,
        processedAt: new Date()
      }
    })
  } catch (err) {
    console.error('Failed to update webhook log:', err)
  }
}
