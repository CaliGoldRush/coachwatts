import { getServerSession } from '../../utils/session'
import { z } from 'zod'
import { sportSettingsRepository } from '../../utils/repositories/sportSettingsRepository'
import { profileUpdateSchema } from '../../utils/schemas/profile'
import { athleteMetricsService } from '../../utils/athleteMetricsService'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)

  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const result = profileUpdateSchema.safeParse(body)

  if (!result.success) {
    console.warn('[PATCH /api/profile] Validation failed:', {
      user: session.user.email,
      errors: result.error.issues,
      body: body
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.issues
    })
  }

  const data = result.data
  const userEmail = session.user.email

  try {
    // Fetch user to get ID
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    })
    if (!user) throw createError({ statusCode: 404, message: 'User not found' })

    // 1. Update Metrics via Service (Weight, FTP, LTHR, MaxHR)
    // This also handles goal syncing and zone recalculation
    const updatedUser = await athleteMetricsService.updateMetrics(user.id, {
      ftp: data.ftp,
      weight: data.weight,
      maxHr: data.maxHr,
      lthr: data.lthr
    })

    // 2. Update remaining User fields
    const { sportSettings, hrZones, powerZones, ftp, weight, maxHr, lthr, ...otherData } = data

    if (Object.keys(otherData).length > 0) {
      // Normalize sex
      if (otherData.sex === 'M') otherData.sex = 'Male'
      if (otherData.sex === 'F') otherData.sex = 'Female'

      // Handle date conversion for DOB
      const updatePayload: any = { ...otherData }
      if (updatePayload.dob) {
        updatePayload.dob = new Date(updatePayload.dob)
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updatePayload
      })
    }

    // 3. Update Sport Settings via Repository (if explicitly provided)
    let updatedSettings = []
    if (sportSettings) {
      updatedSettings = await sportSettingsRepository.upsertSettings(updatedUser.id, sportSettings)
    } else {
      // Fetch latest settings (including those updated by athleteMetricsService)
      updatedSettings = await sportSettingsRepository.getByUserId(updatedUser.id)
    }

    // Re-fetch user to return full updated object
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date: Date | null) => {
      if (!date) return null
      return date.toISOString().split('T')[0]
    }

    return {
      success: true,
      profile: {
        ...finalUser,
        dob: formatDate(finalUser?.dob || null),
        // Return updated sport settings
        sportSettings: updatedSettings
      }
    }
  } catch (error) {
    console.error('[PATCH /api/profile] Update failed:', {
      user: userEmail,
      error: error,
      payload: data
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update profile'
    })
  }
})
