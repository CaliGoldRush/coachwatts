import { getServerSession } from '../../utils/session'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { chatToolDeclarations, executeToolCall } from '../../utils/chat-tools'
import { generateCoachAnalysis } from '../../utils/gemini'
import { buildAthleteContext } from '../../utils/services/chatContextService'
import { prisma } from '../../utils/db'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Model configuration (centralized in gemini.ts)
const MODEL_NAMES = {
  flash: 'gemini-flash-latest',
  pro: 'gemini-pro-latest'
} as const

defineRouteMeta({
  openAPI: {
    tags: ['Chat'],
    summary: 'Send chat message',
    description: 'Sends a message to the AI coach and returns the response.',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['roomId', 'content'],
            properties: {
              roomId: { type: 'string' },
              content: { type: 'string' },
              files: { type: 'array', items: { type: 'string' } },
              replyMessage: { type: 'object' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                role: { type: 'string' },
                parts: { type: 'array' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      401: { description: 'Unauthorized' }
    }
  }
})

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

  // 2. Build Athlete Context (Extracted to Service)
  const { userProfile, systemInstruction } = await buildAthleteContext(userId)

  // 3. Fetch Chat History (last 50 messages)
  const history = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  const chronologicalHistory = history.reverse()

  // 6. Build Chat History for Model
  // Gemini requires the first message to be from user, so filter out any leading AI messages
  let historyForModel = chronologicalHistory.map((msg: any) => ({
    role: msg.senderId === 'ai_agent' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }))

  // Remove any leading 'model' messages to ensure first message is 'user'
  while (historyForModel.length > 0 && historyForModel[0] && historyForModel[0].role === 'model') {
    historyForModel = historyForModel.slice(1)
  }

  // 7. Initialize Model with Tools (without JSON mode during tool calling)
  // Use user preference or default to pro for chat (better quality and reasoning)
  const modelName = userProfile?.aiModelPreference === 'flash' ? MODEL_NAMES.flash : MODEL_NAMES.pro

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    tools: [{ functionDeclarations: chatToolDeclarations }]
  })

  // 8. Start Chat with History
  const chat = model.startChat({
    history: historyForModel
  })

  // 9. Send Message and Handle Tool Calls Iteratively
  let result = await chat.sendMessage(content)
  let response = result.response

  // Maximum 5 rounds of tool calls to prevent infinite loops
  let roundCount = 0
  const MAX_ROUNDS = 5
  const toolCallsUsed: Array<{ name: string; args: any; response: any; timestamp: string }> = []
  const chartData: any[] = []

  while (roundCount < MAX_ROUNDS) {
    const functionCalls = response.functionCalls?.()

    if (!functionCalls || functionCalls.length === 0) {
      break
    }

    roundCount++
    console.log(
      `[Tool Call Round ${roundCount}/${MAX_ROUNDS}] Processing ${functionCalls.length} function call(s)`
    )

    // Process ALL function calls and build responses array
    const functionResponses = await Promise.all(
      functionCalls.map(async (functionCall, index) => {
        const callTimestamp = new Date().toISOString()

        console.log(
          `[Tool Call ${roundCount}.${index + 1}] ${functionCall.name}`,
          functionCall.args
        )

        // Check for duplicates in the current request session
        const isDuplicate = toolCallsUsed.some(
          (prev) =>
            prev.name === functionCall.name &&
            JSON.stringify(prev.args) === JSON.stringify(functionCall.args)
        )

        if (isDuplicate) {
          console.warn(
            `[Tool Call ${roundCount}.${index + 1}] ⚠️ Skipping duplicate execution for ${functionCall.name}`
          )
          const duplicateResponse = {
            success: true,
            message:
              'This tool was already executed successfully with these exact arguments. Do not retry.',
            status: 'ALREADY_COMPLETED'
          }

          return {
            functionResponse: {
              name: functionCall.name,
              response: duplicateResponse
            }
          }
        }

        try {
          const toolResult = await executeToolCall(functionCall.name, functionCall.args, userId)

          console.log(
            `[Tool Result ${roundCount}.${index + 1}] ${functionCall.name}:`,
            typeof toolResult === 'object'
              ? JSON.stringify(toolResult).substring(0, 200) + '...'
              : toolResult
          )

          // Store complete tool call information including response
          toolCallsUsed.push({
            name: functionCall.name,
            args: functionCall.args,
            response: toolResult,
            timestamp: callTimestamp
          })

          return {
            functionResponse: {
              name: functionCall.name,
              response: toolResult
            }
          }
        } catch (error: any) {
          console.error(
            `[Tool Error ${roundCount}.${index + 1}] ${functionCall.name}:`,
            error?.message || error
          )

          const errorResponse = {
            error: `Failed to execute tool: ${error?.message || 'Unknown error'}`
          }

          // Store error response as well
          toolCallsUsed.push({
            name: functionCall.name,
            args: functionCall.args,
            response: errorResponse,
            timestamp: callTimestamp
          })

          return {
            functionResponse: {
              name: functionCall.name,
              response: errorResponse
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

  // Track LLM usage for debugging and cost monitoring
  try {
    const usageMetadata = response.usageMetadata
    const promptTokens = usageMetadata?.promptTokenCount
    const completionTokens = usageMetadata?.candidatesTokenCount
    const totalTokens = usageMetadata?.totalTokenCount

    // Calculate cost (Gemini 2.0 Flash pricing)
    const PRICING = {
      input: 0.075, // $0.075 per 1M input tokens
      output: 0.3 // $0.30 per 1M output tokens
    }
    const estimatedCost =
      promptTokens && completionTokens
        ? (promptTokens / 1_000_000) * PRICING.input +
          (completionTokens / 1_000_000) * PRICING.output
        : undefined

    // Build full prompt context for logging
    const fullPrompt = [
      '=== SYSTEM INSTRUCTION ===',
      systemInstruction,
      '',
      '=== CHAT HISTORY ===',
      ...historyForModel.map(
        (msg: any) =>
          `${msg.role}: ${typeof msg.parts[0] === 'string' ? msg.parts[0] : JSON.stringify(msg.parts[0])}`
      ),
      '',
      '=== USER MESSAGE ===',
      content
    ].join('\n')

    await prisma.llmUsage.create({
      data: {
        userId,
        provider: 'gemini',
        model: modelName,
        modelType: 'flash',
        operation: 'chat',
        entityType: 'ChatMessage',
        entityId: userMessage.id,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
        durationMs: 0, // Not tracking duration for chat
        retryCount: 0,
        success: true,
        promptPreview: fullPrompt.substring(0, 500),
        responsePreview: aiResponseText.substring(0, 500)
      }
    })
  } catch (error) {
    console.error('[Chat] Failed to log LLM usage:', error)
    // Don't fail the chat if logging fails
  }

  // 10. Save AI Response
  const aiMessage = await prisma.chatMessage.create({
    data: {
      content: aiResponseText,
      roomId,
      senderId: 'ai_agent',
      seen: {}
    }
  })

  // 11. Auto-rename room after first AI response
  // Check if this is the first AI response (meaning there are only 2 messages now: user's first + this AI response)
  const messageCount = await prisma.chatMessage.count({
    where: { roomId }
  })

  console.log(`[Chat] Message count for room ${roomId}: ${messageCount}`)

  if (messageCount === 2) {
    // This is the first AI response - generate a concise title
    console.log(`[Chat] Attempting to auto-rename room ${roomId}`)
    try {
      const titlePrompt = `Based on this conversation, generate a very concise, descriptive title (max 6 words). Just return the title, nothing else.

User: ${content}
AI: ${aiResponseText.substring(0, 500)}

Title:`

      console.log(`[Chat] Generating title for room ${roomId}`)
      let roomTitle = await generateCoachAnalysis(titlePrompt, 'flash', {
        userId,
        operation: 'chat_title_generation',
        entityType: 'ChatRoom',
        entityId: roomId
      })
      roomTitle = roomTitle.trim()

      // Clean up the title - remove quotes, limit length
      roomTitle = roomTitle.replace(/^["']|["']$/g, '').substring(0, 60)

      console.log(`[Chat] Generated title: "${roomTitle}"`)

      // Update the room name
      await prisma.chatRoom.update({
        where: { id: roomId },
        data: { name: roomTitle }
      })

      console.log(`[Chat] Successfully renamed room ${roomId} to: "${roomTitle}"`)
    } catch (error: any) {
      console.error(`[Chat] Failed to auto-rename room ${roomId}:`, {
        message: error.message,
        stack: error.stack,
        error
      })
      // Don't fail the whole request if renaming fails
    }
  } else {
    console.log(`[Chat] Skipping auto-rename for room ${roomId} (messageCount: ${messageCount})`)
  }

  // 12. Extract chart data from tool calls
  const chartToolCalls = toolCallsUsed.filter((t) => t.name === 'create_chart')
  const charts = chartToolCalls.map((call, index) => ({
    id: `chart-${aiMessage.id}-${index}`,
    ...call.args
  }))

  // 13. Store chart data and complete tool call information in message metadata
  if (charts.length > 0 || toolCallsUsed.length > 0) {
    await prisma.chatMessage.update({
      where: { id: aiMessage.id },
      data: {
        metadata: {
          charts,
          toolCalls: toolCallsUsed, // Store complete tool call info with args and responses
          toolsUsed: toolCallsUsed.map((t) => t.name), // Keep for backward compatibility
          toolCallCount: toolCallsUsed.length
        } as any // Cast to any to handle Json type
      }
    })
  }

  // 14. Return AI Message in AI SDK v5 format
  return {
    id: aiMessage.id,
    role: 'assistant' as const,
    parts: [
      {
        type: 'text' as const,
        id: `text-${aiMessage.id}`,
        text: aiResponseText
      }
    ],
    metadata: {
      charts,
      toolCalls: toolCallsUsed, // Include complete tool call info in response
      toolsUsed: toolCallsUsed.map((t) => t.name),
      toolCallCount: toolCallsUsed.length,
      createdAt: aiMessage.createdAt
    }
  }
})
