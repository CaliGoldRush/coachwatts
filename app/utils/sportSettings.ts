/**
 * Get the applicable sport settings for a specific activity type.
 * Falls back to Default if no specific match found.
 * Mirrors logic in server/utils/repositories/sportSettingsRepository.ts
 */
export function getSportSettingsForActivity(allSettings: any[], activityType: string) {
  if (!allSettings || allSettings.length === 0) return null

  // Ensure activityType is valid
  if (!activityType) {
    return allSettings.find((s: any) => s.isDefault) || null
  }

  // 1. Exact match in types array (excluding default)
  const specific = allSettings.find(
    (s: any) => !s.isDefault && s.types && s.types.includes(activityType)
  )
  if (specific) return specific

  // 2. Partial match (e.g. "Ride" matches "VirtualRide")
  const partial = allSettings.find(
    (s: any) => !s.isDefault && s.types && s.types.some((t: string) => activityType.includes(t))
  )
  if (partial) return partial

  // 3. Fallback to Default
  return allSettings.find((s: any) => s.isDefault) || null
}

export function getDefaultSportSettings(allSettings: any[]) {
  if (!allSettings) return null
  return allSettings.find((s: any) => s.isDefault) || null
}

/**
 * Determine the preferred metric (hr or power) based on sport settings preference
 * and available data streams.
 */
export function getPreferredMetric(
  settings: any,
  availableData: { hasHr: boolean; hasPower: boolean }
): 'hr' | 'power' {
  const { hasHr, hasPower } = availableData

  // If only one is available, pick that regardless of preference
  if (hasHr && !hasPower) return 'hr'
  if (hasPower && !hasHr) return 'power'
  if (!hasHr && !hasPower) return 'hr' // Final fallback

  // Both available, check preference
  const preference = settings?.loadPreference || 'POWER_HR_PACE'

  if (preference.startsWith('HR')) {
    return 'hr'
  }

  if (preference.startsWith('POWER')) {
    return 'power'
  }

  // Fallback if preference is PACE or something else
  return 'power'
}
