// Standard zone colors for consistency across the application
export const ZONE_COLORS = [
  'rgb(16, 185, 129)', // Z1 - Emerald Green (Recovery)
  'rgb(59, 130, 246)', // Z2 - Royal Blue (Endurance)
  'rgb(245, 158, 11)', // Z3 - Amber/Gold (Tempo)
  'rgb(249, 115, 22)', // Z4 - Deep Orange (Threshold)
  'rgb(239, 68, 68)', // Z5 - Bright Red (VO2 Max)
  'rgb(168, 85, 247)', // Z6 - Electric Purple (Anaerobic)
  'rgb(236, 72, 153)', // Z7 - Pink (Neuromuscular)
  'rgb(88, 28, 135)' // Z8 - Dark Purple (Anaerobic Capacity / Extra)
]

export const FALLBACK_ZONE_COLOR = 'rgb(156, 163, 175)' // Gray-400

/**
 * Get the color for a specific zone index (0-based)
 * @param index Zone index (0 = Z1, 1 = Z2, etc.)
 */
export function getZoneColor(index: number): string {
  return ZONE_COLORS[index] || FALLBACK_ZONE_COLOR
}

/**
 * Get the color for a specific zone name (e.g. "Z1", "Z2")
 * @param name Zone name (case insensitive)
 */
export function getZoneColorByName(name: string): string {
  if (!name) return FALLBACK_ZONE_COLOR

  const upper = name.toUpperCase()
  if (upper.includes('Z1')) return ZONE_COLORS[0]
  if (upper.includes('Z2')) return ZONE_COLORS[1]
  if (upper.includes('Z3')) return ZONE_COLORS[2]
  if (upper.includes('Z4')) return ZONE_COLORS[3]
  if (upper.includes('Z5')) return ZONE_COLORS[4]
  if (upper.includes('Z6')) return ZONE_COLORS[5]
  if (upper.includes('Z7')) return ZONE_COLORS[6]
  if (upper.includes('Z8')) return ZONE_COLORS[7]

  // Fallback for "Warmup", "Active", etc.
  if (upper.includes('WARM')) return ZONE_COLORS[0] // Green
  if (upper.includes('REST') || upper.includes('RECOV')) return ZONE_COLORS[0] // Green
  if (upper.includes('ACTIVE')) return ZONE_COLORS[2] // Amber
  if (upper.includes('COOL')) return ZONE_COLORS[1] // Blue

  return FALLBACK_ZONE_COLOR
}
