import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getUserByGoogleId, createUser, createSession, getUserByEmail, updateUser } from '@/lib/auth-db'

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
  id_token?: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  given_name?: string
  family_name?: string
  picture?: string
}

/**
 * Exchange OAuth code for user info and handle signin
 */
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<GoogleUserInfo> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured')
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange code for token')
  }

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse

  // Get user info
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userInfoResponse.ok) {
    throw new Error('Failed to fetch user info')
  }

  return userInfoResponse.json() as Promise<GoogleUserInfo>
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[v0] Google callback - body keys:', Object.keys(body))

    // Get the redirect URI from request
    const { protocol, host } = request.nextUrl
    const baseUrl = `${protocol}//${host}`
    const redirectUri = `${baseUrl}/api/auth/google/callback`

    // Support both JWT method and OAuth code method
    let googleId: string
    let email: string
    let firstName: string | undefined
    let lastName: string | undefined

    // Method 1: Direct JWT from frontend (existing method)
    if (body.googleId && body.email) {
      googleId = body.googleId
      email = body.email
      firstName = body.firstName
      lastName = body.lastName
      console.log('[v0] Using JWT method')
    }
    // Method 2: OAuth code exchange (new method)
    else if (body.code) {
      console.log('[v0] Using OAuth code method')
      try {
        const userInfo = await exchangeCodeForToken(body.code, redirectUri)
        googleId = userInfo.sub
        email = userInfo.email
        firstName = userInfo.given_name
        lastName = userInfo.family_name
      } catch (error) {
        console.error('[v0] Code exchange error:', error)
        return NextResponse.json(
          { error: 'فشل في تبديل كود Google' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'معرّف Google والبريد الإلكتروني مطلوبان أو كود OAuth مطلوب' },
        { status: 400 }
      )
    }

    // Validation
    if (!googleId || !email) {
      return NextResponse.json(
        { error: 'معرّف Google والبريد الإلكتروني مطلوبان' },
        { status: 400 }
      )
    }

    console.log('[v0] Processing Google login for:', email)

    // Check if user exists by Google ID
    let user = await getUserByGoogleId(googleId)

    // If not found by Google ID, try to find by email
    if (!user) {
      const existingUser = await getUserByEmail(email)
      
      if (existingUser) {
        console.log('[v0] Linking Google ID to existing user')
        // Link Google account to existing user
        user = await updateUser(existingUser.id, { google_id: googleId })
      } else {
        console.log('[v0] Creating new user with Google')
        // Create new user
        user = await createUser({
          email,
          google_id: googleId,
          first_name: firstName || null,
          last_name: lastName || null,
        })
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'فشل معالجة تسجيل الدخول عبر Google' },
        { status: 500 }
      )
    }

    // Create session token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await createSession(user.id, token, expiresAt)

    console.log('[v0] Google login successful for user:', user.id)

    // Return user data and token
    const { password_hash, ...userResponse } = user
    return NextResponse.json({
      user: userResponse,
      token,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('[v0] Google callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'فشل تسجيل الدخول عبر Google'
    return NextResponse.json(
      { error: errorMessage || 'فشل تسجيل الدخول عبر Google' },
      { status: 500 }
    )
  }
}

/**
 * Handle GET requests for OAuth flow redirect
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const error = request.nextUrl.searchParams.get('error')
    const errorDescription = request.nextUrl.searchParams.get('error_description')

    console.log('[v0] Google OAuth callback GET - received code:', !!code)

    // Handle OAuth errors from Google
    if (error) {
      console.error('[v0] Google OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code received' },
        { status: 400 }
      )
    }

    // Process the code and create session
    const response = await POST(
      new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
    )

    const data = await response.json()

    if (!response.ok) {
      // Redirect to signup with error
      return NextResponse.redirect(
        new URL(`/signup?error=${encodeURIComponent(data.error)}`, request.url)
      )
    }

    // Set auth token in cookie and redirect to chat page
    const responseToSend = NextResponse.redirect(new URL('/chat', request.url))
    responseToSend.cookies.set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    // Also set in a non-httpOnly cookie for client-side access
    responseToSend.cookies.set('auth_token_client', data.token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return responseToSend
  } catch (error) {
    console.error('[v0] Google OAuth GET error:', error)
    return NextResponse.redirect(
      new URL('/signup?error=google_auth_failed', request.url)
    )
  }
}
