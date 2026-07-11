import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userPhone, subscription } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, birthDate } = body

    // Validation
    if (!name || !birthDate) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a unique user ID based on name + birthDate
    // This creates a deterministic ID so same user can re-login
    const userId = `user_${Buffer.from(`${name}${birthDate}`).toString('base64').substring(0, 16)}`

    try {
      // Check if user exists
      const existing = await db
        .select()
        .from(userPhone)
        .where(eq(userPhone.id, userId))
        .limit(1)

      if (existing.length === 0) {
        // Create new user
        await db.insert(userPhone).values({
          id: userId,
          phone: '', // Empty since we don't use phone anymore
          name: name.trim(),
          birthdate: birthDate,
          subscriptionplan: 'free',
          isverified: true, // Auto-verify
        })

        // Create subscription for new user
        const subscriptionId = nanoid()
        await db.insert(subscription).values({
          id: subscriptionId,
          userid: userId,
          plan: 'free',
          status: 'active',
          currentmonthusage: 0,
        })
      }

      // Return response with userId
      const response = NextResponse.json(
        {
          message: 'Login successful',
          userId,
          name: name.trim(),
          plan: 'free',
        },
        { status: 200 }
      )

      // Set secure cookie
      response.cookies.set('userId', userId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })

      return response
    } catch (dbError) {
      console.error('[API] Database error:', dbError)
      return NextResponse.json(
        { message: 'Failed to login' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[API] Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
