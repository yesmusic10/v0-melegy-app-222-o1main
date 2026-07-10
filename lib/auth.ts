import { betterAuth } from "better-auth"
import { Pool } from "pg"

let authInstance: ReturnType<typeof betterAuth> | null = null

function getAuth() {
  if (!authInstance) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })

    authInstance = betterAuth({
      database: pool,
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL 
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:3000`),
      trustedOrigins: [
        process.env.BETTER_AUTH_URL || "",
        process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "",
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
        process.env.V0_RUNTIME_URL || "",
      ].filter(Boolean),
      emailAndPassword: {
        enabled: true,
      },
      plugins: [],
      advanced: {
        defaultCookieAttributes: process.env.NODE_ENV === "development" 
          ? { sameSite: "none", secure: true }
          : undefined,
      },
    })
  }
  return authInstance
}

export { getAuth as auth }
