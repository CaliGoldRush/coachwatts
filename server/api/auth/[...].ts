import { NuxtAuthHandler } from '#auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '../../utils/db'
import { getCookie, parseCookies } from 'h3'
import fs from 'fs'
import path from 'path'

const logFile = path.resolve(process.cwd(), 'logs/auth-debug.log')

function log(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`
  try {
    fs.appendFileSync(logFile, logMessage)
  } catch (e) {
    console.error('Failed to write to log file', e)
  }
}

export default NuxtAuthHandler({
  adapter: PrismaAdapter(prisma),
  providers: [
    // @ts-expect-error - Types mismatch between next-auth versions
    GoogleProvider.default({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NUXT_AUTH_SECRET,
  // Trust host header to automatically determine the callback URL at runtime
  trustHost: true,
  callbacks: {
    async jwt({ token, trigger, session: newSession }) {
      // This callback is called whenever a JWT is created or updated
      // We can use it to inject the impersonation cookie data
      
      if (trigger === 'update' && newSession?.impersonatedUserId) {
        // Store impersonation in token when explicitly updated
        token.impersonatedUserId = newSession.impersonatedUserId
        log('DEBUG: JWT callback - impersonation set', { impersonatedUserId: newSession.impersonatedUserId })
      }
      
      return token
    },
    async session({ session, user, token, trigger, newSession }) {
      log('DEBUG: Session callback triggered', {
        hasSessionUser: !!session?.user,
        userId: user?.id,
        hasToken: !!token,
        trigger
      })

      // Handle AUTH_BYPASS_USER
      // If bypass is set and no user is currently logged in, try to auto-login the specified user
      if (process.env.AUTH_BYPASS_USER && !session.user && !user) {
        log('DEBUG: No user found, checking bypass', { bypassEmail: process.env.AUTH_BYPASS_USER })
         const bypassUser = await prisma.user.findUnique({
           where: { email: process.env.AUTH_BYPASS_USER }
         })
         
         if (bypassUser) {
           log('DEBUG: Bypass user found, creating session', { userId: bypassUser.id })
           session.user = {
             id: bypassUser.id,
             name: bypassUser.name,
             email: bypassUser.email,
             image: bypassUser.image,
             // @ts-expect-error - Admin flag
             isAdmin: bypassUser.isAdmin || false
           }
           // Synthesize user object for subsequent logic
           user = { ...bypassUser, id: bypassUser.id } as any
           log('DEBUG: Bypassed auth successfully', { userId: bypassUser.id })
         } else {
           log('DEBUG: Bypass user not found', { email: process.env.AUTH_BYPASS_USER })
         }
      }

      if (session.user) {
        // Use user object if available, otherwise we're in bypass mode
        const currentUser = user || session.user
        
        // Check for impersonation cookie in the token (stored by NextAuth)
        // NextAuth passes cookies through the token in JWT mode, but we're using database sessions
        // So we need to check if impersonation is stored in the token
        let impersonatedUserId = (token as any)?.impersonatedUserId || null
        
        log('DEBUG: Impersonation check', { impersonatedUserId, hasToken: !!token })
        
        // Only admins can impersonate
        const originalUserIsAdmin = (currentUser as any).isAdmin || false
        log('DEBUG: Admin check', { originalUserIsAdmin, userId: currentUser.id })

        if (impersonatedUserId && originalUserIsAdmin) {
          try {
            const impersonatedUser = await prisma.user.findUnique({
              where: { id: impersonatedUserId }
            })
            log('DEBUG: Impersonated user lookup', { found: !!impersonatedUser })
            
            if (impersonatedUser) {
              session.user.id = impersonatedUser.id
              session.user.name = impersonatedUser.name
              session.user.email = impersonatedUser.email
              session.user.image = impersonatedUser.image
              session.user.isAdmin = false // Impersonated user should not be admin
              log('DEBUG: Session overridden with impersonated user')
            } else {
              // Fallback to original user if impersonated user not found
              session.user.id = currentUser.id
              session.user.isAdmin = originalUserIsAdmin
            }
          } catch (error) {
            log('DEBUG: Error looking up impersonated user', error)
            session.user.id = currentUser.id
            session.user.isAdmin = originalUserIsAdmin
          }
        } else {
          session.user.id = currentUser.id
          session.user.isAdmin = originalUserIsAdmin
        }
      }
      return session
    },
  },
})
