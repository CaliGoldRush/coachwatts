import 'dotenv/config'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'

// Connection configuration for DragonflyDB/Redis
// Log to see what we are getting
const envUrl = process.env.REDIS_URL

if (!envUrl) {
  // Only warn if we are clearly missing it, but we fallback gracefully for local defaults
  // console.warn('[Queue] WARNING: REDIS_URL not set, using default redis://localhost:6379')
}

const connectionString = envUrl || 'redis://localhost:6379'

// Create a Redis connection instance
const connection = new IORedis(connectionString, {
  maxRetriesPerRequest: null // Required by BullMQ
})

// Redis Connection Logging
connection.on('connect', () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_REDIS) {
    const options = connection.options
    const hasPassword = !!options.password
    console.log(
      `[Queue] Redis connected to ${options.host}:${options.port} (Password: ${hasPassword ? 'Yes' : 'No'})`
    )
  }
})

connection.on('error', (err) => {
  // Always log as a warning to keep the app running without crashing
  console.warn('[Queue] Redis connection warning:', err.message)
})

export const webhookQueue = new Queue('webhookQueue', { connection })
export const pingQueue = new Queue('pingQueue', { connection })
