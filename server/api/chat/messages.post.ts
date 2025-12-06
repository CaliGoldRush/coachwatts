import { getServerSession } from '#auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { chatToolDeclarations, executeToolCall } from '../../utils/chat-tools'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const userId = (session.user as any).id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'User ID not found' })
  }

  const body = await readBody(event)
  const { roomId, content, files, replyMessage } = body

  if (!roomId || !content) {
    throw createError({ statusCode: 400, message: 'Room ID and content required' })
  }

  // 1. Save User Message
  const userMessage = await prisma.chatMessage.create({
    data: {
      content,
      roomId,
      senderId: userId,
      files: files || undefined,
      replyToId: replyMessage?._id || undefined,
      seen: { [userId]: new Date() }
    }
  })

  // 2. Fetch User Profile for Context
  const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      ftp: true,
      maxHr: true,
      weight: true,
      dob: true,
      currentFitnessScore: true,
      recoveryCapacityScore: true,
      nutritionComplianceScore: true,
      trainingConsistencyScore: true,
      currentFitnessExplanation: true,
      recoveryCapacityExplanation: true,
      nutritionComplianceExplanation: true,
      trainingConsistencyExplanation: true,
      currentFitnessExplanationJson: true,
      recoveryCapacityExplanationJson: true,
      nutritionComplianceExplanationJson: true,
      trainingConsistencyExplanationJson: true,
      profileLastUpdated: true
    }
  })

  // 3. Fetch Chat History (last 50 messages)
  const history = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  
  const chronologicalHistory = history.reverse()

  // 4. Fetch Recent Activity Data (Last 7 Days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Fetch recent workouts
  const recentWorkouts = await prisma.workout.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo }
    },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      title: true,
      type: true,
      durationSec: true,
      distanceMeters: true,
      averageWatts: true,
      normalizedPower: true,
      averageHr: true,
      tss: true,
      intensity: true,
      trainingLoad: true,
      rpe: true,
      feel: true,
      description: true,
      overallScore: true,
      aiAnalysisJson: true
    }
  })

  // Fetch recent nutrition
  const recentNutrition = await prisma.nutrition.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo }
    },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      fiber: true,
      sugar: true,
      aiAnalysisJson: true
    }
  })

  // Fetch recent wellness
  const recentWellness = await prisma.wellness.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo }
    },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      recoveryScore: true,
      hrv: true,
      restingHr: true,
      sleepHours: true,
      sleepScore: true,
      readiness: true,
      fatigue: true,
      soreness: true,
      stress: true,
      mood: true
    }
  })

  // 5. Build Comprehensive Athlete Context
  let athleteContext = '\n\n## Athlete Profile\n'
  
  if (userProfile) {
    if (userProfile.name) athleteContext += `- **Name**: ${userProfile.name}\n`
    
    const metrics: string[] = []
    if (userProfile.ftp) metrics.push(`FTP: ${userProfile.ftp}W`)
    if (userProfile.maxHr) metrics.push(`Max HR: ${userProfile.maxHr} bpm`)
    if (userProfile.weight) {
      metrics.push(`Weight: ${userProfile.weight}kg`)
      if (userProfile.ftp) {
        metrics.push(`W/kg: ${(userProfile.ftp / userProfile.weight).toFixed(2)}`)
      }
    }
    if (userProfile.dob) {
      const age = Math.floor((Date.now() - new Date(userProfile.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      metrics.push(`Age: ${age}`)
    }
    if (metrics.length > 0) {
      athleteContext += `- **Physical Metrics**: ${metrics.join(', ')}\n`
    }
    
    const scores: string[] = []
    if (userProfile.currentFitnessScore) scores.push(`Fitness: ${userProfile.currentFitnessScore}/10`)
    if (userProfile.recoveryCapacityScore) scores.push(`Recovery: ${userProfile.recoveryCapacityScore}/10`)
    if (userProfile.nutritionComplianceScore) scores.push(`Nutrition: ${userProfile.nutritionComplianceScore}/10`)
    if (userProfile.trainingConsistencyScore) scores.push(`Consistency: ${userProfile.trainingConsistencyScore}/10`)
    if (scores.length > 0) {
      athleteContext += `- **Current Scores**: ${scores.join(', ')}\n`
    }
    
    // Add detailed explanations with JSON insights
    if (userProfile.currentFitnessExplanation) {
      athleteContext += `\n### Fitness Insights\n${userProfile.currentFitnessExplanation}\n`
      if (userProfile.currentFitnessExplanationJson) {
        athleteContext += `\n**Structured Insights**: ${JSON.stringify(userProfile.currentFitnessExplanationJson)}\n`
      }
    }
    if (userProfile.recoveryCapacityExplanation) {
      athleteContext += `\n### Recovery Insights\n${userProfile.recoveryCapacityExplanation}\n`
      if (userProfile.recoveryCapacityExplanationJson) {
        athleteContext += `\n**Structured Insights**: ${JSON.stringify(userProfile.recoveryCapacityExplanationJson)}\n`
      }
    }
    if (userProfile.nutritionComplianceExplanation) {
      athleteContext += `\n### Nutrition Insights\n${userProfile.nutritionComplianceExplanation}\n`
      if (userProfile.nutritionComplianceExplanationJson) {
        athleteContext += `\n**Structured Insights**: ${JSON.stringify(userProfile.nutritionComplianceExplanationJson)}\n`
      }
    }
    if (userProfile.trainingConsistencyExplanation) {
      athleteContext += `\n### Training Consistency Insights\n${userProfile.trainingConsistencyExplanation}\n`
      if (userProfile.trainingConsistencyExplanationJson) {
        athleteContext += `\n**Structured Insights**: ${JSON.stringify(userProfile.trainingConsistencyExplanationJson)}\n`
      }
    }
    
    if (userProfile.profileLastUpdated) {
      athleteContext += `\n*Profile last updated: ${new Date(userProfile.profileLastUpdated).toLocaleDateString()}*\n`
    }
  }

  // Add Recent Activity Summary (Last 7 Days)
  athleteContext += '\n\n## Recent Activity (Last 7 Days)\n'
  
  // Recent Workouts Summary
  if (recentWorkouts.length > 0) {
    athleteContext += `\n### Workouts (${recentWorkouts.length} activities)\n`
    for (const workout of recentWorkouts) {
      athleteContext += `- **${workout.date.toLocaleDateString()}**: ${workout.title || workout.type}\n`
      athleteContext += `  - Duration: ${Math.round(workout.durationSec / 60)} min`
      if (workout.distanceMeters) athleteContext += ` | Distance: ${(workout.distanceMeters / 1000).toFixed(1)} km`
      if (workout.averageWatts) athleteContext += ` | Avg Power: ${workout.averageWatts}W`
      if (workout.tss) athleteContext += ` | TSS: ${Math.round(workout.tss)}`
      if (workout.overallScore) athleteContext += ` | Score: ${workout.overallScore}/10`
      athleteContext += '\n'
      
      if (workout.aiAnalysisJson) {
        athleteContext += `  - AI Analysis: ${JSON.stringify(workout.aiAnalysisJson)}\n`
      }
    }
  } else {
    athleteContext += '\n### Workouts\nNo workouts in the last 7 days\n'
  }
  
  // Recent Nutrition Summary
  if (recentNutrition.length > 0) {
    athleteContext += `\n### Nutrition (${recentNutrition.length} days logged)\n`
    for (const nutrition of recentNutrition) {
      athleteContext += `- **${nutrition.date.toLocaleDateString()}**: `
      athleteContext += `${nutrition.calories || 0} kcal`
      if (nutrition.protein) athleteContext += ` | Protein: ${Math.round(nutrition.protein)}g`
      if (nutrition.carbs) athleteContext += ` | Carbs: ${Math.round(nutrition.carbs)}g`
      if (nutrition.fat) athleteContext += ` | Fat: ${Math.round(nutrition.fat)}g`
      athleteContext += '\n'
      
      if (nutrition.aiAnalysisJson) {
        athleteContext += `  - AI Analysis: ${JSON.stringify(nutrition.aiAnalysisJson)}\n`
      }
    }
  } else {
    athleteContext += '\n### Nutrition\nNo nutrition data in the last 7 days\n'
  }
  
  // Recent Wellness Summary
  if (recentWellness.length > 0) {
    athleteContext += `\n### Wellness & Recovery (${recentWellness.length} days)\n`
    for (const wellness of recentWellness) {
      athleteContext += `- **${wellness.date.toLocaleDateString()}**: `
      const metrics: string[] = []
      if (wellness.recoveryScore) metrics.push(`Recovery: ${wellness.recoveryScore}%`)
      if (wellness.hrv) metrics.push(`HRV: ${wellness.hrv}ms`)
      if (wellness.sleepHours) metrics.push(`Sleep: ${wellness.sleepHours}h`)
      if (wellness.sleepScore) metrics.push(`Sleep Score: ${wellness.sleepScore}%`)
      if (wellness.readiness) metrics.push(`Readiness: ${wellness.readiness}%`)
      athleteContext += metrics.join(' | ') + '\n'
    }
  } else {
    athleteContext += '\n### Wellness & Recovery\nNo wellness data in the last 7 days\n'
  }

  // 5. Build System Instruction
  const systemInstruction = `You are Coach Watts, an AI-powered cycling coach.
You are helpful, encouraging, and knowledgeable about cycling training, nutrition, and recovery.

You have access to tools that let you fetch the athlete's workout data, nutrition logs, and wellness metrics.
When the athlete asks about their activities, performance, or progress, use the appropriate tools to fetch the actual data before responding.

${athleteContext}

Always provide specific, data-driven insights when possible. Use the tools to access real data rather than making assumptions.`

  // 6. Build Chat History for Model
  // Gemini requires the first message to be from user, so filter out any leading AI messages
  let historyForModel = chronologicalHistory.map((msg: any) => ({
    role: msg.senderId === 'ai_agent' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }))

  // Remove any leading 'model' messages to ensure first message is 'user'
  while (historyForModel.length > 0 && historyForModel[0].role === 'model') {
    historyForModel = historyForModel.slice(1)
  }

  // 7. Initialize Model with Tools
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction,
    tools: [{ functionDeclarations: chatToolDeclarations }],
  })

  // 8. Start Chat with History
  const chat = model.startChat({
    history: historyForModel,
  })

  // 9. Send Message and Handle Tool Calls Iteratively
  let result = await chat.sendMessage(content)
  let response = result.response
  
  // Maximum 5 rounds of tool calls to prevent infinite loops
  let roundCount = 0
  const MAX_ROUNDS = 5
  const toolCallsUsed: Array<{ name: string; args: any }> = []

  while (roundCount < MAX_ROUNDS) {
    const functionCalls = response.functionCalls?.()
    
    if (!functionCalls || functionCalls.length === 0) {
      break
    }
    
    roundCount++
    console.log(`[Tool Call Round ${roundCount}/${MAX_ROUNDS}] Processing ${functionCalls.length} function call(s)`)
    
    // Process ALL function calls and build responses array
    const functionResponses = await Promise.all(
      functionCalls.map(async (functionCall, index) => {
        toolCallsUsed.push({ name: functionCall.name, args: functionCall.args })
        
        console.log(`[Tool Call ${roundCount}.${index + 1}] ${functionCall.name}`, functionCall.args)
        
        try {
          const toolResult = await executeToolCall(
            functionCall.name,
            functionCall.args,
            userId
          )
          
          console.log(`[Tool Result ${roundCount}.${index + 1}] ${functionCall.name}:`,
            typeof toolResult === 'object' ? JSON.stringify(toolResult).substring(0, 200) + '...' : toolResult
          )
          
          return {
            functionResponse: {
              name: functionCall.name,
              response: toolResult
            }
          }
        } catch (error: any) {
          console.error(`[Tool Error ${roundCount}.${index + 1}] ${functionCall.name}:`, error?.message || error)
          
          return {
            functionResponse: {
              name: functionCall.name,
              response: { error: `Failed to execute tool: ${error?.message || 'Unknown error'}` }
            }
          }
        }
      })
    )
    
    // Send all function responses back together
    result = await chat.sendMessage(functionResponses)
    response = result.response
  }
  
  if (roundCount >= MAX_ROUNDS) {
    console.warn(`Reached maximum tool call rounds (${MAX_ROUNDS}). Tools used:`, toolCallsUsed)
  }

  const aiResponseText = response.text()

  // 10. Save AI Response
  const aiMessage = await prisma.chatMessage.create({
    data: {
      content: aiResponseText,
      roomId,
      senderId: 'ai_agent',
      seen: {}
    }
  })

  // 11. Return AI Message in vue-advanced-chat format
  return {
    _id: aiMessage.id,
    content: aiResponseText,
    senderId: aiMessage.senderId,
    username: 'Coach Watts',
    avatar: '/images/logo.svg',
    date: new Date(aiMessage.createdAt).toLocaleDateString(),
    timestamp: new Date(aiMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    system: false,
    saved: true,
    distributed: true,
    seen: false,
    disableActions: false,
    disableReactions: false,
    metadata: toolCallsUsed.length > 0 ? {
      toolsUsed: toolCallsUsed.map(t => t.name),
      toolCallCount: toolCallsUsed.length
    } : undefined
  }
})
