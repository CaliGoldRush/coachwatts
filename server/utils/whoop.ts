import type { Integration } from '@prisma/client'

interface WhoopSleep {
  id: string
  created_at: string
  updated_at: string
  start: string
  end: string
  score_state: string
  score?: {
    stage_summary: {
      total_in_bed_time_milli: number
      total_awake_time_milli: number
      total_light_sleep_time_milli: number
      total_slow_wave_sleep_time_milli: number
      total_rem_sleep_time_milli: number
    }
    sleep_performance_percentage?: number
    sleep_efficiency_percentage?: number
    respiratory_rate?: number
  }
}

interface WhoopRecovery {
  cycle_id: number
  sleep_id: string  // v2 uses UUID string
  user_id: number
  created_at: string
  updated_at: string
  score_state: string
  score?: {
    user_calibrating: boolean
    recovery_score: number
    resting_heart_rate: number
    hrv_rmssd_milli: number
    spo2_percentage?: number
    skin_temp_celsius?: number
  }
}

interface WhoopRecoveryResponse {
  records: WhoopRecovery[]
  next_token?: string
}

interface WhoopUser {
  user_id: number
  email: string
  first_name: string
  last_name: string
}

export async function fetchWhoopRecovery(
  integration: Integration,
  startDate: Date,
  endDate: Date
): Promise<WhoopRecovery[]> {
  const url = new URL('https://api.prod.whoop.com/developer/v2/recovery')
  url.searchParams.set('start', startDate.toISOString())
  url.searchParams.set('end', endDate.toISOString())
  url.searchParams.set('limit', '25')
  
  const allRecords: WhoopRecovery[] = []
  let nextToken: string | undefined

  do {
    if (nextToken) {
      url.searchParams.set('nextToken', nextToken)
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('WHOOP API Error Response:', errorText)
      console.error('Request URL:', url.toString())
      throw new Error(`Whoop API error: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    const data: WhoopRecoveryResponse = await response.json()
    console.log('WHOOP Recovery API Response:', JSON.stringify(data, null, 2))
    console.log(`Fetched ${data.records?.length || 0} recovery records`)
    
    if (data.records && data.records.length > 0) {
      console.log('First recovery record sample:', JSON.stringify(data.records[0], null, 2))
    }
    
    allRecords.push(...(data.records || []))
    nextToken = data.next_token
  } while (nextToken)
  
  return allRecords
}

export async function fetchWhoopSleep(integration: Integration, sleepId: string): Promise<WhoopSleep | null> {
  try {
    const response = await fetch(`https://api.prod.whoop.com/developer/v2/activity/sleep/${sleepId}`, {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch sleep ${sleepId}:`, response.status)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error fetching sleep ${sleepId}:`, error)
    return null
  }
}

export async function fetchWhoopUser(accessToken: string): Promise<WhoopUser> {
  const response = await fetch('https://api.prod.whoop.com/developer/v2/user/profile/basic', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) {
    throw new Error(`Whoop API error: ${response.status} ${response.statusText}`)
  }
  
  return await response.json()
}

export function normalizeWhoopRecovery(recovery: WhoopRecovery, userId: string, sleep?: WhoopSleep | null) {
  console.log('Normalizing WHOOP recovery:', JSON.stringify(recovery, null, 2))
  if (sleep) {
    console.log('With sleep data:', JSON.stringify(sleep, null, 2))
  }
  
  // Parse the date - use created_at for the recovery date
  const recoveryDate = new Date(recovery.created_at)
  // Create date-only (removing time component) in UTC
  const dateOnly = new Date(Date.UTC(recoveryDate.getUTCFullYear(), recoveryDate.getUTCMonth(), recoveryDate.getUTCDate()))
  
  console.log('Date parsing:', {
    created_at: recovery.created_at,
    parsed_date: recoveryDate.toISOString(),
    date_only: dateOnly.toISOString(),
    date_only_formatted: dateOnly.toLocaleDateString()
  })
  
  // Only process if recovery has a score (state is SCORED)
  if (!recovery.score || recovery.score_state !== 'SCORED') {
    console.log(`Skipping recovery - state: ${recovery.score_state}, has score: ${!!recovery.score}`)
    return null
  }
  
  // Extract sleep data if available
  let sleepSecs = null
  let sleepHours = null
  let sleepScore = null
  
  if (sleep && sleep.score) {
    const totalSleepMilli =
      sleep.score.stage_summary.total_light_sleep_time_milli +
      sleep.score.stage_summary.total_slow_wave_sleep_time_milli +
      sleep.score.stage_summary.total_rem_sleep_time_milli
    
    sleepSecs = Math.round(totalSleepMilli / 1000)
    sleepHours = Math.round((sleepSecs / 3600) * 10) / 10
    sleepScore = sleep.score.sleep_performance_percentage ? Math.round(sleep.score.sleep_performance_percentage) : null
    
    console.log('Sleep data extracted:', { sleepSecs, sleepHours, sleepScore })
  }
  
  console.log('Recovery score data:', {
    recovery_score: recovery.score.recovery_score,
    hrv: recovery.score.hrv_rmssd_milli,
    resting_hr: recovery.score.resting_heart_rate,
    spo2: recovery.score.spo2_percentage
  })
  
  const result = {
    userId,
    date: dateOnly,
    hrv: recovery.score.hrv_rmssd_milli,
    hrvSdnn: null,
    restingHr: Math.round(recovery.score.resting_heart_rate),
    avgSleepingHr: null,
    sleepSecs,
    sleepHours,
    sleepScore,
    sleepQuality: null,
    readiness: null,
    recoveryScore: Math.round(recovery.score.recovery_score),
    soreness: null,
    fatigue: null,
    stress: null,
    mood: null,
    motivation: null,
    weight: null,
    spO2: recovery.score.spo2_percentage ? Math.round(recovery.score.spo2_percentage * 10) / 10 : null,
    ctl: null,
    atl: null,
    comments: null,
    rawJson: { recovery, sleep }
  }
  
  console.log('Final wellness record:', JSON.stringify(result, null, 2))
  
  return result
}