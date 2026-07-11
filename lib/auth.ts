import { betterAuth } from 'better-auth'
import { google } from 'better-auth/social-providers'
import { pool } from '@/lib/db'

const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.V0_RUNTIME_URL)

const trustedOrigins = [
  ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
    : []),
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]

export const auth = betterAuth({
  database: pool,
  baseURL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  ...(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET
    ? {
        socialProviders: {
          google: google({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }) as any,
        },
      }
    : {}),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    defaultCookieAttributes:
      process.env.NODE_ENV === 'development'
        ? {
            sameSite: 'none' as const,
            secure: true,
          }
        : {
            sameSite: 'lax' as const,
            secure: true,
          },
  },
})
