import { H3Event, getCookie } from 'h3'
import { getServerSession as getBaseSession } from '#auth'
import { prisma } from './db'

/**
 * Get the effective user session, respecting impersonation.
 * This should be used instead of getServerSession() directly.
 */
export async function getServerSession(event: H3Event) {
  // Check for impersonation cookie first
  const impersonatedUserId = getCookie(event, 'auth.impersonated_user_id')
  
  // Get the base session from NextAuth
  const session = await getBaseSession(event)
  
  // If no session and auth bypass is enabled
  if (!session?.user) {
    if (process.env.AUTH_BYPASS_USER) {
      const bypassUser = await prisma.user.findUnique({
        where: { email: process.env.AUTH_BYPASS_USER }
      })
      
      if (bypassUser) {
        // If impersonation is active, return impersonated user
        if (impersonatedUserId) {
          try {
            const impersonatedUser = await prisma.user.findUnique({
              where: { id: impersonatedUserId }
            })
            
            if (impersonatedUser) {
              return {
                user: {
                  id: impersonatedUser.id,
                  name: impersonatedUser.name,
                  email: impersonatedUser.email,
                  image: impersonatedUser.image,
                  isAdmin: false,
                  isImpersonating: true,
                  originalUserId: bypassUser.id,
                  originalUserEmail: bypassUser.email
                },
                expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          } catch (error) {
            console.error('[Session] Error looking up impersonated user:', error)
          }
        }
        
        // Return bypass user
        return {
          user: {
            id: bypassUser.id,
            name: bypassUser.name,
            email: bypassUser.email,
            image: bypassUser.image,
            isAdmin: (bypassUser as any).isAdmin || false
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    }
    return session
  }

  // Ensure isAdmin flag is included
  const user = session.user as any
  if (user.isAdmin === undefined) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })
    if (dbUser) {
      user.isAdmin = (dbUser as any).isAdmin || false
    }
  }

  // Check for impersonation
  if (!impersonatedUserId) {
    return session
  }

  // Check if the current user is admin
  if (!user.isAdmin) {
    return session
  }

  // Look up the impersonated user
  try {
    const impersonatedUser = await prisma.user.findUnique({
      where: { id: impersonatedUserId }
    })

    if (impersonatedUser) {
      // Return modified session with impersonated user
      return {
        ...session,
        user: {
          id: impersonatedUser.id,
          name: impersonatedUser.name,
          email: impersonatedUser.email,
          image: impersonatedUser.image,
          isAdmin: false,
          isImpersonating: true,
          originalUserId: user.id,
          originalUserEmail: user.email
        }
      }
    }
  } catch (error) {
    console.error('[Session] Error looking up impersonated user:', error)
  }

  // Fallback to normal session
  return session
}
