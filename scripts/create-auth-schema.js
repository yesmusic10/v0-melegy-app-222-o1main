import postgres from "postgres"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error("[v0] ERROR: DATABASE_URL not set")
  process.exit(1)
}

const sql = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
})

async function main() {
  console.log("[v0] Creating auth schema...")

  try {
    // Create auth_users table
    await sql`
      CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("[v0] auth_users table: OK")

    // Create auth_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("[v0] auth_sessions table: OK")

    // Add user_id column to conversations if it doesn't exist
    await sql`
      ALTER TABLE conversations 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE
    `
    console.log("[v0] conversations table updated: OK")

    // Add user_id column to chat_messages if it doesn't exist
    await sql`
      ALTER TABLE chat_messages 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE
    `
    console.log("[v0] chat_messages table updated: OK")

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id)
    `
    console.log("[v0] Indexes created: OK")

    console.log("[v0] Auth schema setup complete!")
  } catch (error) {
    console.error("[v0] Error:", error.message)
    throw error
  }

  await sql.end()
}

main().catch((err) => {
  console.error("[v0] FAILED:", err.message)
  process.exit(1)
})
