import { logger, task } from '@trigger.dev/sdk/v3'
import { prisma } from '../server/utils/db'
import { fetchIntervalsAthleteProfile } from '../server/utils/intervals'
import { sportSettingsRepository } from '../server/utils/repositories/sportSettingsRepository'
import { userIngestionQueue } from './queues'
import { roundToTwoDecimals } from '../server/utils/number'

export const autodetectIntervalsProfileTask = task({
  id: 'autodetect-intervals-profile',
  maxDuration: 300, // 5 minutes
  queue: userIngestionQueue,
  run: async (payload: { userId: string; forceUpdate?: boolean }) => {
    const { userId, forceUpdate = false } = payload

    logger.log('Starting Intervals.icu profile auto-detection', { userId, forceUpdate })

    // Fetch user and integration
    const [user, integration] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.integration.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: 'intervals'
          }
        }
      })
    ])

    if (!user) throw new Error('User not found')
    if (!integration) throw new Error('Intervals integration not found')

    // Check if profile is complete (now looking at sport settings)
    const settings = await sportSettingsRepository.getByUserId(userId)
    const hasDefaultZones = settings.some((s) => s.isDefault && (s.hrZones as any[])?.length > 0)
    const hasFtp = user.ftp && user.ftp > 0

    if (hasFtp && hasDefaultZones && !forceUpdate) {
      logger.log('Profile is already configured and forceUpdate is false. Skipping auto-detection.')
      return { success: true, message: 'Profile already configured' }
    }

    try {
      // Fetch comprehensive profile from Intervals.icu
      const intervalsProfile = await fetchIntervalsAthleteProfile(integration)

      const userUpdateData: any = {}

      // 1. Update Global User Metrics
      if (intervalsProfile.ftp) userUpdateData.ftp = intervalsProfile.ftp
      if (intervalsProfile.maxHR) userUpdateData.maxHr = intervalsProfile.maxHR
      if (intervalsProfile.lthr) userUpdateData.lthr = intervalsProfile.lthr
      if (intervalsProfile.weight)
        userUpdateData.weight = roundToTwoDecimals(intervalsProfile.weight)
      if (intervalsProfile.restingHR) userUpdateData.restingHr = intervalsProfile.restingHR
      if (intervalsProfile.timezone && !user.timezone)
        userUpdateData.timezone = intervalsProfile.timezone

      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: userUpdateData
        })
      }

      // 2. Sync All Sport Specific Settings
      if (intervalsProfile.sportSettings && intervalsProfile.sportSettings.length > 0) {
        logger.log(
          `Syncing ${intervalsProfile.sportSettings.length} sport profiles from Intervals.icu`
        )

        const settingsPayload = intervalsProfile.sportSettings.map((s: any) => ({
          name: s.types.join('/'),
          types: s.types,
          ftp: s.ftp,
          lthr: s.lthr,
          maxHr: s.maxHr,
          hrZones: s.hrZones,
          powerZones: s.powerZones,
          externalId: s.externalId,
          source: 'intervals'
        }))

        await sportSettingsRepository.upsertSettings(userId, settingsPayload)
      } else {
        // If no specific settings, ensure we at least have a Default profile from the main metrics
        await sportSettingsRepository.getDefault(userId)
      }

      logger.log('Profile updated automatically from Intervals.icu', {
        userId,
        updatedUserFields: Object.keys(userUpdateData)
      })

      return {
        success: true,
        message: 'Profile updated successfully',
        updatedFields: Object.keys(userUpdateData)
      }
    } catch (error) {
      logger.error('Error auto-detecting profile from Intervals.icu', { error })
      throw error
    }
  }
})
