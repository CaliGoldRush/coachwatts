import { logger, task } from "@trigger.dev/sdk/v3";
import { generateCoachAnalysis } from "../server/utils/gemini";
import { prisma } from "../server/utils/db";

export const analyzeWorkoutTask = task({
  id: "analyze-workout",
  maxDuration: 300, // 5 minutes for AI processing
  run: async (payload: { workoutId: string }) => {
    const { workoutId } = payload;
    
    logger.log("Starting workout analysis", { workoutId });
    
    // Update workout status to PROCESSING
    await prisma.workout.update({
      where: { id: workoutId },
      data: { aiAnalysisStatus: 'PROCESSING' }
    });
    
    try {
      // Fetch the workout
      const workout = await prisma.workout.findUnique({
        where: { id: workoutId }
      });
      
      if (!workout) {
        throw new Error('Workout not found');
      }
      
      logger.log("Workout data fetched", { 
        workoutId,
        title: workout.title,
        date: workout.date
      });
      
      // Build comprehensive workout data for analysis
      const workoutData = buildWorkoutAnalysisData(workout);
      
      // Generate the prompt
      const prompt = buildWorkoutAnalysisPrompt(workoutData);
      
      logger.log("Generating analysis with Gemini Flash");
      
      // Generate analysis using Gemini
      const analysis = await generateCoachAnalysis(prompt, 'flash');
      
      logger.log("Analysis generated successfully", { 
        analysisLength: analysis.length 
      });
      
      // Save the analysis to the database
      await prisma.workout.update({
        where: { id: workoutId },
        data: {
          aiAnalysis: analysis,
          aiAnalysisStatus: 'COMPLETED',
          aiAnalyzedAt: new Date()
        }
      });
      
      logger.log("Analysis saved to database");
      
      return {
        success: true,
        workoutId,
        analysisLength: analysis.length
      };
    } catch (error) {
      logger.error("Error generating workout analysis", { error });
      
      await prisma.workout.update({
        where: { id: workoutId },
        data: {
          aiAnalysisStatus: 'FAILED'
        }
      });
      
      throw error;
    }
  }
});

function buildWorkoutAnalysisData(workout: any) {
  const data: any = {
    id: workout.id,
    date: workout.date,
    title: workout.title,
    description: workout.description,
    type: workout.type,
    duration_m: Math.round(workout.durationSec / 60),
    duration_s: workout.durationSec,
    distance_m: workout.distanceMeters,
    elevation_gain: workout.elevationGain
  }
  
  // Power metrics
  if (workout.averageWatts) data.avg_power = workout.averageWatts
  if (workout.maxWatts) data.max_power = workout.maxWatts
  if (workout.normalizedPower) data.normalized_power = workout.normalizedPower
  if (workout.weightedAvgWatts) data.weighted_avg_power = workout.weightedAvgWatts
  if (workout.ftp) data.ftp = workout.ftp
  
  // Heart rate
  if (workout.averageHr) data.avg_hr = workout.averageHr
  if (workout.maxHr) data.max_hr = workout.maxHr
  
  // Cadence
  if (workout.averageCadence) data.avg_cadence = workout.averageCadence
  if (workout.maxCadence) data.max_cadence = workout.maxCadence
  
  // Speed
  if (workout.averageSpeed) data.avg_speed_ms = workout.averageSpeed / 3.6 // km/h to m/s
  
  // Training metrics
  if (workout.tss) data.tss = workout.tss
  if (workout.trainingLoad) data.training_load = workout.trainingLoad
  if (workout.intensity) data.intensity = workout.intensity
  if (workout.kilojoules) data.kilojoules = workout.kilojoules
  
  // Performance metrics
  if (workout.variabilityIndex) data.variability_index = workout.variabilityIndex
  if (workout.powerHrRatio) data.power_hr_ratio = workout.powerHrRatio
  if (workout.efficiencyFactor) data.efficiency_factor = workout.efficiencyFactor
  if (workout.decoupling) data.decoupling = workout.decoupling
  if (workout.polarizationIndex) data.polarization_index = workout.polarizationIndex
  
  // Training status
  if (workout.ctl) data.ctl = workout.ctl
  if (workout.atl) data.atl = workout.atl
  
  // Subjective
  if (workout.rpe) data.rpe = workout.rpe
  if (workout.sessionRpe) data.session_rpe = workout.sessionRpe
  if (workout.feel) data.feel = workout.feel
  
  // Environment
  if (workout.avgTemp !== null && workout.avgTemp !== undefined) data.avg_temp = workout.avgTemp
  if (workout.trainer !== null && workout.trainer !== undefined) data.trainer = workout.trainer
  
  // L/R Balance
  if (workout.lrBalance) data.lr_balance = workout.lrBalance
  
  // Extract intervals from rawJson if available
  if (workout.rawJson && typeof workout.rawJson === 'object') {
    const raw = workout.rawJson as any
    if (raw.icu_intervals && Array.isArray(raw.icu_intervals)) {
      data.intervals = raw.icu_intervals.slice(0, 10).map((interval: any) => ({
        type: interval.type,
        label: interval.label,
        duration_s: interval.elapsed_time,
        distance_m: interval.distance,
        avg_power: interval.average_watts,
        max_power: interval.max_watts,
        weighted_avg_power: interval.weighted_average_watts,
        intensity: interval.intensity,
        avg_hr: interval.average_heartrate,
        max_hr: interval.max_heartrate,
        avg_cadence: interval.average_cadence,
        max_cadence: interval.max_cadence,
        avg_speed_ms: interval.average_speed,
        decoupling: interval.decoupling,
        variability: interval.w5s_variability,
        elevation_gain: interval.total_elevation_gain,
        avg_gradient: interval.average_gradient
      }))
    }
  }
  
  return data
}

function buildWorkoutAnalysisPrompt(workoutData: any): string {
  const formatMetric = (value: any, decimals = 1) => {
    return value !== undefined && value !== null ? Number(value).toFixed(decimals) : 'N/A'
  }
  
  let prompt = `You are an expert cycling coach analyzing a workout. Provide a comprehensive technique-focused analysis.

## Workout Details
- **Date**: ${new Date(workoutData.date).toLocaleDateString()}
- **Title**: ${workoutData.title}
- **Type**: ${workoutData.type || 'N/A'}
- **Duration**: ${workoutData.duration_m} minutes (${workoutData.duration_s}s)
`

  if (workoutData.distance_m) {
    prompt += `- **Distance**: ${(workoutData.distance_m / 1000).toFixed(2)} km\n`
  }
  
  if (workoutData.elevation_gain) {
    prompt += `- **Elevation Gain**: ${workoutData.elevation_gain}m\n`
  }

  prompt += '\n## Power Metrics\n'
  if (workoutData.avg_power) prompt += `- Average Power: ${workoutData.avg_power}W\n`
  if (workoutData.max_power) prompt += `- Max Power: ${workoutData.max_power}W\n`
  if (workoutData.normalized_power) prompt += `- Normalized Power: ${workoutData.normalized_power}W\n`
  if (workoutData.weighted_avg_power) prompt += `- Weighted Avg Power: ${workoutData.weighted_avg_power}W\n`
  if (workoutData.ftp) prompt += `- FTP at time: ${workoutData.ftp}W\n`
  if (workoutData.intensity) prompt += `- Intensity Factor: ${formatMetric(workoutData.intensity, 3)}\n`

  prompt += '\n## Heart Rate & Cadence\n'
  if (workoutData.avg_hr) prompt += `- Average HR: ${workoutData.avg_hr} bpm\n`
  if (workoutData.max_hr) prompt += `- Max HR: ${workoutData.max_hr} bpm\n`
  if (workoutData.avg_cadence) prompt += `- Average Cadence: ${workoutData.avg_cadence} rpm\n`
  if (workoutData.max_cadence) prompt += `- Max Cadence: ${workoutData.max_cadence} rpm\n`

  prompt += '\n## Performance Indicators\n'
  if (workoutData.variability_index) {
    prompt += `- Variability Index (VI): ${formatMetric(workoutData.variability_index, 3)}\n`
    prompt += `  - 1.00-1.05 = Excellent pacing, 1.05-1.10 = Good, >1.10 = Poor pacing\n`
  }
  if (workoutData.efficiency_factor) {
    prompt += `- Efficiency Factor (EF): ${formatMetric(workoutData.efficiency_factor, 2)} (Watts/HR - higher is better)\n`
  }
  if (workoutData.decoupling !== undefined) {
    const decouplingPct = workoutData.decoupling * 100
    prompt += `- Decoupling: ${formatMetric(decouplingPct, 1)}%\n`
    prompt += `  - <5% = Excellent aerobic efficiency, 5-10% = Good, >10% = Needs aerobic work\n`
  }
  if (workoutData.power_hr_ratio) {
    prompt += `- Power/HR Ratio: ${formatMetric(workoutData.power_hr_ratio, 2)}\n`
  }
  if (workoutData.lr_balance) {
    prompt += `- L/R Balance: ${formatMetric(workoutData.lr_balance, 1)}%\n`
    prompt += `  - 48-52% = Acceptable, 50/50 = Ideal, >53% = Significant imbalance\n`
  }

  prompt += '\n## Training Load\n'
  if (workoutData.tss) prompt += `- TSS: ${formatMetric(workoutData.tss, 0)}\n`
  if (workoutData.training_load) prompt += `- Training Load: ${formatMetric(workoutData.training_load, 1)}\n`
  if (workoutData.kilojoules) prompt += `- Kilojoules: ${formatMetric(workoutData.kilojoules / 1000, 1)}k\n`

  if (workoutData.ctl || workoutData.atl) {
    prompt += '\n## Fitness Status\n'
    if (workoutData.ctl) prompt += `- CTL (Fitness): ${formatMetric(workoutData.ctl, 1)}\n`
    if (workoutData.atl) prompt += `- ATL (Fatigue): ${formatMetric(workoutData.atl, 1)}\n`
    if (workoutData.ctl && workoutData.atl) {
      const tsb = workoutData.ctl - workoutData.atl
      prompt += `- TSB (Form): ${formatMetric(tsb, 1)}\n`
    }
  }

  if (workoutData.rpe || workoutData.feel) {
    prompt += '\n## Subjective Metrics\n'
    if (workoutData.rpe) prompt += `- RPE: ${workoutData.rpe}/10\n`
    if (workoutData.feel) prompt += `- Feel: ${workoutData.feel}/10\n`
  }

  if (workoutData.trainer !== undefined || workoutData.avg_temp !== undefined) {
    prompt += '\n## Environment\n'
    if (workoutData.trainer !== undefined) prompt += `- Indoor Trainer: ${workoutData.trainer ? 'Yes' : 'No'}\n`
    if (workoutData.avg_temp !== undefined) prompt += `- Avg Temperature: ${formatMetric(workoutData.avg_temp, 1)}°C\n`
  }

  // Add interval analysis if available
  if (workoutData.intervals && workoutData.intervals.length > 0) {
    prompt += '\n## Interval Breakdown\n'
    workoutData.intervals.forEach((interval: any, index: number) => {
      prompt += `\n### Interval ${index + 1}: ${interval.label || interval.type || 'Unnamed'}\n`
      if (interval.duration_s) prompt += `- Duration: ${Math.round(interval.duration_s / 60)}m ${interval.duration_s % 60}s\n`
      if (interval.avg_power) prompt += `- Avg Power: ${interval.avg_power}W\n`
      if (interval.intensity) prompt += `- Intensity: ${formatMetric(interval.intensity, 2)}\n`
      if (interval.avg_hr) prompt += `- Avg HR: ${interval.avg_hr} bpm\n`
      if (interval.avg_cadence) prompt += `- Avg Cadence: ${interval.avg_cadence} rpm\n`
      if (interval.variability) prompt += `- Power Variability: ${formatMetric(interval.variability, 2)}\n`
    })
  }

  if (workoutData.description) {
    prompt += `\n## Workout Description\n${workoutData.description}\n`
  }

  prompt += `

## Analysis Request

Please provide a detailed technique-focused analysis covering:

1. **Pacing Strategy**: Analyze power variability (VI) and identify any surging behavior or pacing issues
2. **Pedaling Efficiency**: Evaluate cadence patterns and L/R balance if available
3. **Power Application**: Assess consistency, fade patterns, and zone adherence
4. **Workout Execution**: Evaluate how well target power/intensity was maintained
5. **Technique Recommendations**: Specific drills or focuses to improve identified weaknesses
6. **Key Takeaways**: 2-3 main insights from this workout

Focus on actionable coaching advice that helps improve cycling technique and performance. Be specific and reference the metrics provided.`

  return prompt
}