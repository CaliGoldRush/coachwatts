import FitParser from 'fit-file-parser'
import {
  calculateLapSplits,
  calculatePaceVariability,
  calculatePaceZones,
  analyzePacingStrategy,
  detectSurges
} from './pacing'

/**
 * Parsed FIT file data structure
 */
export interface FitData {
  protocolVersion: number
  profileVersion: number
  activity: any
  sessions: any[]
  laps: any[]
  records: any[]
  events: any[]
  device_infos: any[]
  [key: string]: any
}

/**
 * Parse a FIT file buffer into a structured object
 */
export function parseFitFile(buffer: Buffer): Promise<FitData> {
  return new Promise((resolve, reject) => {
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'm/s', // Consistent with database units
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'list'
    })

    fitParser.parse(buffer as any, (error: any, data: any) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}

interface FitStreams {
  time: number[]
  distance: number[]
  velocity: number[]
  heartrate: number[]
  cadence: number[]
  watts: number[]
  altitude: number[]
  latlng: [number, number][]
  grade: number[]
  moving: boolean[]
  [key: string]: any[]
}

/**
 * Extract time-series streams from FIT records
 */
export function extractFitStreams(records: any[]) {
  const streams: FitStreams = {
    time: [],
    distance: [],
    velocity: [], // pace/speed
    heartrate: [],
    cadence: [],
    watts: [],
    altitude: [],
    latlng: [],
    grade: [],
    moving: []
  }

  records.forEach((record: any) => {
    // Only include records with timestamps
    if (!record.timestamp) return

    // Base time/distance
    if (record.elapsed_time !== undefined) streams.time.push(record.elapsed_time)
    if (record.distance !== undefined) streams.distance.push(record.distance)

    // Metrics
    if (record.speed !== undefined) streams.velocity.push(record.speed)
    if (record.heart_rate !== undefined) streams.heartrate.push(record.heart_rate)
    if (record.cadence !== undefined) streams.cadence.push(record.cadence)
    if (record.power !== undefined) streams.watts.push(record.power)
    if (record.altitude !== undefined) streams.altitude.push(record.altitude)
    if (record.grade !== undefined) streams.grade.push(record.grade)

    // GPS
    if (record.position_lat && record.position_long) {
      streams.latlng.push([record.position_lat, record.position_long])
    }
  })

  // Fill in missing streams if possible
  const numRecords = streams.time.length

  // Grade: If missing but we have altitude and distance, we can calculate it
  if (
    streams.grade.length === 0 &&
    streams.altitude.length === numRecords &&
    streams.distance.length === numRecords
  ) {
    // Simple grade calculation
    for (let i = 0; i < numRecords; i++) {
      if (i === 0) {
        streams.grade.push(0)
        continue
      }

      const currentDist = streams.distance[i]
      const prevDist = streams.distance[i - 1]
      const currentAlt = streams.altitude[i]
      const prevAlt = streams.altitude[i - 1]

      if (
        currentDist !== undefined &&
        prevDist !== undefined &&
        currentAlt !== undefined &&
        prevAlt !== undefined
      ) {
        const distDiff = currentDist - prevDist
        const altDiff = currentAlt - prevAlt

        if (distDiff > 0) {
          streams.grade.push((altDiff / distDiff) * 100)
        } else {
          streams.grade.push(0)
        }
      } else {
        streams.grade.push(0)
      }
    }
  }

  // Moving: If missing, calculate based on speed/velocity
  if (streams.moving.length === 0 && streams.velocity.length === numRecords) {
    const MOVING_THRESHOLD = 0.5 // m/s
    streams.moving = streams.velocity.map((v) => v > MOVING_THRESHOLD)
  } else if (streams.moving.length === 0 && streams.cadence.length === numRecords) {
    // Fallback to cadence if velocity is missing (e.g. indoor trainer)
    streams.moving = streams.cadence.map((c) => c > 0)
  } else if (streams.moving.length === 0 && streams.watts.length === numRecords) {
    // Fallback to power
    streams.moving = streams.watts.map((p) => p > 0)
  }

  return streams
}

/**
 * Normalize a FIT session into a standard Workout structure
 */
export function normalizeFitSession(session: any, userId: string, filename: string) {
  // Generate a predictable external ID based on file info
  // Use timestamp if available, otherwise filename hash
  const timestamp = session.start_time ? new Date(session.start_time).getTime() : Date.now()
  const externalId = `fit_${timestamp}_${filename.replace(/\W/g, '_')}`

  return {
    userId,
    externalId,
    source: 'fit_file',
    date: session.start_time ? new Date(session.start_time) : new Date(),
    title: filename.replace('.fit', '').replace(/[_-]/g, ' '),
    description: `Imported from ${filename}`,
    type: session.sport ? capitalize(session.sport) : 'Activity',

    // Core Metrics
    durationSec: Math.round(session.total_timer_time || 0),
    distanceMeters: session.total_distance,
    elevationGain: Math.round(session.total_ascent || 0),
    calories: Math.round(session.total_calories || 0),

    // Averages
    averageWatts: Math.round(session.avg_power || 0) || undefined,
    maxWatts: Math.round(session.max_power || 0) || undefined,
    averageHr: Math.round(session.avg_heart_rate || 0) || undefined,
    maxHr: Math.round(session.max_heart_rate || 0) || undefined,
    averageCadence: Math.round(session.avg_cadence || 0) || undefined,
    maxCadence: Math.round(session.max_cadence || 0) || undefined,
    averageSpeed: session.avg_speed, // m/s

    // Advanced
    normalizedPower: Math.round(session.normalized_power || 0) || undefined,
    tss: session.training_stress_score,

    // Raw data
    rawJson: session
  }
}

function capitalize(s: string) {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/**
 * Reconstruct a session object from records if the main session message is missing
 */
export function reconstructSessionFromRecords(records: any[]) {
  if (!records || records.length === 0) return null

  // Sort records by timestamp just in case
  const sortedRecords = [...records].sort((a, b) => {
    const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return tA - tB
  })

  const firstRecord = sortedRecords[0]
  const lastRecord = sortedRecords[sortedRecords.length - 1]

  // Initialize accumulators
  let totalPower = 0
  let totalHr = 0
  let totalCadence = 0
  let totalSpeed = 0
  let powerCount = 0
  let hrCount = 0
  let cadenceCount = 0
  let speedCount = 0

  let maxPower = 0
  let maxHr = 0
  let maxCadence = 0

  sortedRecords.forEach((record) => {
    if (record.power !== undefined) {
      totalPower += record.power
      powerCount++
      if (record.power > maxPower) maxPower = record.power
    }
    if (record.heart_rate !== undefined) {
      totalHr += record.heart_rate
      hrCount++
      if (record.heart_rate > maxHr) maxHr = record.heart_rate
    }
    if (record.cadence !== undefined) {
      totalCadence += record.cadence
      cadenceCount++
      if (record.cadence > maxCadence) maxCadence = record.cadence
    }
    if (record.speed !== undefined) {
      totalSpeed += record.speed
      speedCount++
    }
  })

  const startTime = firstRecord.timestamp ? new Date(firstRecord.timestamp) : new Date()

  // Use elapsed_time from last record if available, otherwise calc diff
  let totalTimerTime = lastRecord.elapsed_time || 0
  if (!totalTimerTime && lastRecord.timestamp && firstRecord.timestamp) {
    totalTimerTime =
      (new Date(lastRecord.timestamp).getTime() - new Date(firstRecord.timestamp).getTime()) / 1000
  }

  const totalDistance = lastRecord.distance || 0

  return {
    start_time: startTime,
    total_timer_time: totalTimerTime,
    total_distance: totalDistance,
    total_ascent: 0, // Hard to calc without complex logic from altitude stream
    total_calories: 0,
    avg_power: powerCount > 0 ? Math.round(totalPower / powerCount) : 0,
    max_power: maxPower,
    avg_heart_rate: hrCount > 0 ? Math.round(totalHr / hrCount) : 0,
    max_heart_rate: maxHr,
    avg_cadence: cadenceCount > 0 ? Math.round(totalCadence / cadenceCount) : 0,
    max_cadence: maxCadence,
    avg_speed: speedCount > 0 ? totalSpeed / speedCount : 0,
    sport: 'Activity', // Generic default
    reconstructed: true
  }
}
