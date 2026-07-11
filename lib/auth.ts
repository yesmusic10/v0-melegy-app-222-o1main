import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { google } from 'better-auth/social-providers'
import type { BetterAuthOptions } from 'better-auth'
import { db, pool } from '@/lib/db'
import * as schema from '@/lib/db/schema'

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.V0_RUNTIME_URL || 'http://localhost:3000')

const trustedOrigins = [
  baseURL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost',
  'http://127.0.0.1:3000',
  ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
    : []),
].filter((origin) => origin && origin.trim() !== '')
  .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

const authConfig: BetterAuthOptions = {
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET || '',
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
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
}

export const auth = betterAuth(authConfig)
