import { verifyOTP, getUserByPhone } from '@/lib/services/sms-service'
import { db } from '@/lib/db'
import { userPhone } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

// Simple in-memory token store (in production, use Redis or database)
const tokenStore = new Map<string, { userId: string; expiresAt: number }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, otp } = body

    // Validation
    if (!phone || !otp) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify OTP
    const verified = await verifyOTP(phone, otp)
    if (!verified) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 401 }
      )
    }

    // Get user
    const user = await getUserByPhone(phone)
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Create session token
    const token = nanoid(32)
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    tokenStore.set(token, { userId: user.id, expiresAt })

    // Return response
    const response = NextResponse.json(
      {
        message: 'Verified successfully',
        token,
        userId: user.id,
        name: user.name,
        phone: user.phone,
        subscriptionPlan: user.subscriptionPlan,
      },
      { status: 200 }
    )

    // Set secure cookie
    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error) {
    console.error('[API] Error verifying OTP:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper to validate token
export function validateToken(token: string): string | null {
  const data = tokenStore.get(token)
  if (!data) return null
  if (Date.now() > data.expiresAt) {
    tokenStore.delete(token)
    return null
  }
  return data.userId
}
