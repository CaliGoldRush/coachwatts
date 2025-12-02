import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  
  if (!session?.user) {
    throw createError({ 
      statusCode: 401,
      message: 'Unauthorized' 
    })
  }
  
  const body = await readBody(event)
  const { username, password } = body
  
  if (!username || !password) {
    throw createError({ 
      statusCode: 400,
      message: 'Username and password are required' 
    })
  }
  
  try {
    // Test credentials by attempting to create client
    const { Yazio } = await import('yazio')
    const yazio = new Yazio({
      credentials: { username, password }
    })
    
    // Test API call to verify credentials
    const today = new Date().toISOString().split('T')[0]
    await yazio.user.getDailySummary({ date: today })
    
    // Store integration
    const integration = await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: (session.user as any).id,
          provider: 'yazio'
        }
      },
      update: {
        accessToken: username,
        refreshToken: password,
        syncStatus: 'SUCCESS',
        lastSyncAt: new Date()
      },
      create: {
        userId: (session.user as any).id,
        provider: 'yazio',
        accessToken: username,
        refreshToken: password,
        syncStatus: 'SUCCESS'
      }
    })
    
    return {
      success: true,
      integrationId: integration.id
    }
  } catch (error) {
    console.error('Yazio connection error:', error)
    throw createError({
      statusCode: 401,
      message: 'Invalid Yazio credentials or API error'
    })
  }
})