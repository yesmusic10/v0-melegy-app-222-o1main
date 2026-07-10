import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { createUser, getUserByEmail, createSession } from '@/lib/auth-db'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Signup request received')
    
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('[v0] Invalid content type:', contentType)
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('[v0] Request body parsed:', { email: body.email })
    
    const { email, password, firstName, lastName } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون على الأقل 6 أحرف' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'هذا البريد الإلكتروني مسجل بالفعل' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await createUser({
      email,
      password_hash: passwordHash,
      first_name: firstName || null,
      last_name: lastName || null,
    })

    // Create session token for auto-login
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    await createSession(user.id, token, expiresAt)

    // Remove sensitive data before returning
    const { password_hash, ...userResponse } = user
    console.log('[v0] User created successfully:', { userId: user.id })
    
    return NextResponse.json({
      user: userResponse,
      token,
      expiresAt: expiresAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('[v0] Signup error:', error)
    const errorMessage = error instanceof Error ? error.message : 'فشل إنشاء الحساب'
    return NextResponse.json(
      { error: errorMessage || 'فشل إنشاء الحساب' },
      { status: 500 }
    )
  }
}
