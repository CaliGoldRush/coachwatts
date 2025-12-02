import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export type GeminiModel = 'flash' | 'pro'

const MODEL_NAMES = {
  flash: 'gemini-2.0-flash-exp',
  pro: 'gemini-2.0-flash-thinking-exp-1219'
} as const

export async function generateCoachAnalysis(
  prompt: string,
  modelType: GeminiModel = 'flash'
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAMES[modelType]
  })
  
  const result = await model.generateContent(prompt)
  const response = result.response
  return response.text()
}

export async function generateStructuredAnalysis<T>(
  prompt: string,
  schema: any,
  modelType: GeminiModel = 'flash'
): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAMES[modelType],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema
    }
  })
  
  const result = await model.generateContent(prompt)
  const response = result.response
  return JSON.parse(response.text())
}

export function buildWorkoutSummary(workouts: any[]): string {
  return workouts.map((w, idx) => {
    const lines = [
      `### Workout ${idx + 1}: ${w.title}`,
      `- **Date**: ${new Date(w.date).toLocaleDateString()}`,
      `- **Duration**: ${Math.round(w.durationSec / 60)} minutes`,
      `- **Type**: ${w.type || 'Unknown'}`,
    ];
    
    // Power metrics
    if (w.averageWatts) lines.push(`- **Average Power**: ${w.averageWatts}W`);
    if (w.normalizedPower) lines.push(`- **Normalized Power**: ${w.normalizedPower}W`);
    if (w.maxWatts) lines.push(`- **Max Power**: ${w.maxWatts}W`);
    if (w.weightedAvgWatts) lines.push(`- **Weighted Avg Power**: ${w.weightedAvgWatts}W`);
    
    // Heart rate metrics
    if (w.averageHr) lines.push(`- **Average HR**: ${w.averageHr} bpm`);
    if (w.maxHr) lines.push(`- **Max HR**: ${w.maxHr} bpm`);
    
    // Cadence
    if (w.averageCadence) lines.push(`- **Average Cadence**: ${w.averageCadence} rpm`);
    if (w.maxCadence) lines.push(`- **Max Cadence**: ${w.maxCadence} rpm`);
    
    // Training load & intensity
    if (w.tss) lines.push(`- **TSS**: ${Math.round(w.tss)}`);
    if (w.trainingLoad) lines.push(`- **Training Load**: ${Math.round(w.trainingLoad)}`);
    if (w.intensity) lines.push(`- **Intensity Factor**: ${w.intensity.toFixed(2)}`);
    if (w.kilojoules) lines.push(`- **Energy**: ${w.kilojoules} kJ`);
    
    // Distance & elevation
    if (w.distanceMeters) lines.push(`- **Distance**: ${(w.distanceMeters / 1000).toFixed(1)} km`);
    if (w.elevationGain) lines.push(`- **Elevation**: ${w.elevationGain}m`);
    if (w.averageSpeed) lines.push(`- **Avg Speed**: ${(w.averageSpeed * 3.6).toFixed(1)} km/h`);
    
    // Performance metrics
    if (w.variabilityIndex) lines.push(`- **Variability Index**: ${w.variabilityIndex.toFixed(2)}`);
    if (w.powerHrRatio) lines.push(`- **Power/HR Ratio**: ${w.powerHrRatio.toFixed(2)}`);
    if (w.efficiencyFactor) lines.push(`- **Efficiency Factor**: ${w.efficiencyFactor.toFixed(2)}`);
    if (w.decoupling) lines.push(`- **Decoupling**: ${w.decoupling.toFixed(1)}%`);
    
    // Fitness tracking
    if (w.ctl) lines.push(`- **CTL (Fitness)**: ${Math.round(w.ctl)}`);
    if (w.atl) lines.push(`- **ATL (Fatigue)**: ${Math.round(w.atl)}`);
    
    // Subjective metrics
    if (w.rpe) lines.push(`- **RPE**: ${w.rpe}/10`);
    if (w.sessionRpe) lines.push(`- **Session RPE**: ${w.sessionRpe}`);
    if (w.feel) lines.push(`- **Feel**: ${w.feel}/10`);
    
    // Environmental
    if (w.avgTemp !== null && w.avgTemp !== undefined) lines.push(`- **Avg Temperature**: ${w.avgTemp.toFixed(1)}°C`);
    if (w.trainer) lines.push(`- **Indoor Trainer**: Yes`);
    
    // Balance
    if (w.lrBalance) lines.push(`- **L/R Balance**: ${w.lrBalance.toFixed(1)}%`);
    
    // Description
    if (w.description) lines.push(`\n**Description**: ${w.description}`);
    
    return lines.join('\n');
  }).join('\n\n');
}

export function buildMetricsSummary(metrics: any[]): string {
  return metrics.map(m => {
    const parts = [
      `**${new Date(m.date).toLocaleDateString()}**:`
    ];
    
    // Recovery metrics
    if (m.recoveryScore !== null) parts.push(`Recovery ${m.recoveryScore}%`);
    if (m.hrv !== null) parts.push(`HRV ${m.hrv}ms`);
    if (m.restingHr !== null) parts.push(`Resting HR ${m.restingHr}bpm`);
    
    // Sleep metrics
    if (m.sleepHours !== null) parts.push(`Sleep ${m.sleepHours.toFixed(1)}h`);
    if (m.sleepScore !== null) parts.push(`Sleep Score ${m.sleepScore}%`);
    
    // Additional metrics
    if (m.spO2 !== null) parts.push(`SpO2 ${m.spO2}%`);
    if (m.readiness !== null) parts.push(`Readiness ${m.readiness}/10`);
    
    // Subjective wellness
    if (m.fatigue !== null) parts.push(`Fatigue ${m.fatigue}/10`);
    if (m.soreness !== null) parts.push(`Soreness ${m.soreness}/10`);
    if (m.stress !== null) parts.push(`Stress ${m.stress}/10`);
    if (m.mood !== null) parts.push(`Mood ${m.mood}/10`);
    
    return parts.join(', ');
  }).join('\n')
}

/**
 * Build a comprehensive workout summary including raw JSON data if available.
 * Use this when you want the AI to have access to ALL available data including
 * fields that might not be normalized yet.
 *
 * @param workouts Array of workout objects
 * @param includeRawJson Whether to include the complete rawJson field (default: false)
 */
export function buildComprehensiveWorkoutSummary(workouts: any[], includeRawJson = false): string {
  const summary = buildWorkoutSummary(workouts);
  
  if (!includeRawJson) {
    return summary;
  }
  
  // Add raw JSON data for workouts that have it
  const rawDataSection = workouts
    .filter(w => w.rawJson)
    .map((w, idx) => {
      return `\n### Raw Data for Workout ${idx + 1}:\n\`\`\`json\n${JSON.stringify(w.rawJson, null, 2)}\n\`\`\``;
    })
    .join('\n');
  
  return rawDataSection ? `${summary}\n\n## Complete Raw Data\n${rawDataSection}` : summary;
}