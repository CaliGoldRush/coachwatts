import './init'
import { logger, task } from '@trigger.dev/sdk/v3'
import { userIngestionQueue } from './queues'
import { polarService } from '../server/utils/services/polarService'

export const ingestPolarTask = task({
  id: 'ingest-polar',
  queue: userIngestionQueue,
  maxDuration: 900, // 15 minutes
  run: async (payload: { userId: string }, { ctx }) => {
    const { userId } = payload
    logger.log('[Polar Ingest] Starting ingestion', { userId })

    try {
      const results = await polarService.syncUser(userId)
      logger.log('[Polar Ingest] Ingestion complete', { results })

      return {
        success: true,
        ...results
      }
    } catch (error) {
      logger.error('[Polar Ingest] Failed', { error })
      throw error
    }
  }
})
