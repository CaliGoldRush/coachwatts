import { defineNitroPlugin } from 'nitropack/runtime'
import { getCookie, setCookie, getHeader } from 'h3'
import { prisma } from '../utils/db'
import { v4 as uuidv4 } from 'uuid'

export default defineNitroPlugin((nitroApp: any) => {
  nitroApp.hooks.hook('request', async (event: any) => {
    // Only run if bypass is enabled
    if (!process.env.AUTH_BYPASS_USER) return

    const url = event.node.req.url || ''
    
    // Skip internal/asset routes
    if (url.startsWith('/_') || url.match(/\.(js|css|png|jpg|svg|ico|woff|woff2|ttf)/)) {
      return
    }

    // Check for impersonation cookie - if present, skip auth bypass to allow impersonation to work
    const impersonatedUserId = getCookie(event, 'auth.impersonated_user_id')
    if (impersonatedUserId) {
      console.log(`[Auth Bypass] Impersonation detected, skipping bypass for impersonated user: ${impersonatedUserId}`)
      return
    }

    // Check if session token cookie already exists
    let sessionToken = getCookie(event, 'next-auth.session-token') || getCookie(event, '__Secure-next-auth.session-token')
    
    // If it's an impersonation session, skip auth bypass
    if (sessionToken && sessionToken.startsWith('impersonate-')) {
      return
    }
    
    console.log(`[Auth Bypass] Checking request: ${url}`)
    
    // If a session already exists, validate it's still good
    if (sessionToken) {
      console.log(`[Auth Bypass] Found existing session token: ${sessionToken.substring(0, 10)}...`)
      try {
        const session = await prisma.session.findUnique({
          where: { sessionToken },
          include: { user: true }
        })
        
        // If session is valid and not expired, we're good
        if (session && session.expires > new Date()) {
          console.log(`[Auth Bypass] Session valid for ${session.user.email}`)
          return
        }
        
        console.log(`[Auth Bypass] Session invalid or expired, creating new one`)
        // Session exists but is invalid/expired, delete it
        if (session) {
          await prisma.session.delete({
            where: { sessionToken }
          })
        }
      } catch (error) {
        console.error('[Auth Bypass] Error validating session:', error)
      }
    } else {
      console.log(`[Auth Bypass] No session token found in cookies`)
    }

    try {
      // Find the bypass user
      const user = await prisma.user.findUnique({
        where: { email: process.env.AUTH_BYPASS_USER }
      })

      if (!user) {
        console.warn(`[Auth Bypass] User not found: ${process.env.AUTH_BYPASS_USER}`)
        return
      }

      const bypassName = process.env.AUTH_BYPASS_NAME || user.name
      console.log(`[Auth Bypass] Creating session for ${bypassName} (${user.email})`)

      // Delete any existing expired sessions for this user (cleanup)
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          expires: {
            lt: new Date()
          }
        }
      })

      // Create a new session token
      const newToken = uuidv4()
      const expires = new Date()
      expires.setDate(expires.getDate() + 30) // 30 days expiry

      // Create session in database (required for PrismaAdapter)
      await prisma.session.create({
        data: {
          sessionToken: newToken,
          userId: user.id,
          expires
        }
      })

      // Set the cookie
      setCookie(event, 'next-auth.session-token', newToken, {
        httpOnly: true,
        secure: false, // false for localhost development
        path: '/',
        expires,
        sameSite: 'lax'
      })

      console.log(`[Auth Bypass] ✓ Session created and cookie set`)
      console.log(`[Auth Bypass] Token: ${newToken.substring(0, 20)}...`)
      
      // IMPORTANT: Inject the cookie into the current request headers
      // so NextAuth can see it immediately
      if (event.node.req.headers.cookie) {
        event.node.req.headers.cookie += `; next-auth.session-token=${newToken}`
      } else {
        event.node.req.headers.cookie = `next-auth.session-token=${newToken}`
      }
      
      console.log(`[Auth Bypass] ✓ Injected cookie into request headers`)
    } catch (error) {
      console.error('[Auth Bypass] Error creating session:', error)
    }
  })
})
