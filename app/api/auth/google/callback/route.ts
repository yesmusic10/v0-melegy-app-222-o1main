import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import {
  getUserByGoogleId,
  createUser,
  createSession,
  getUserByEmail,
  updateUser,
} from '@/lib/auth-db'

const COOKIE_OPTS = {
  path: '/',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60,
}

/**
 * Google redirects here after the user approves the consent screen.
 * We exchange the one-time `code`, find-or-create the user, mint a session,
 * set cookies, and go straight to /chat.
 */
export async function GET(request: NextRequest) {
  const { searchParams, protocol, host } = request.nextUrl

  const oauthError = searchParams.get('error')
  const code = searchParams.get('code')

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(oauthError)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=no_code', request.url))
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/auth?error=server_misconfigured', request.url)
    )
  }

  // Must exactly match what was sent in google-oauth/route.ts
  const redirectUri = `${protocol}//${host}/api/auth/google/callback`

  try {
    // ── 1. Exchange code for access_token ──────────────────────────────────────
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
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

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('[v0] Token exchange failed:', errText)
      return NextResponse.redirect(
        new URL('/auth?error=token_exchange_failed', request.url)
      )
    }

    const { access_token } = await tokenRes.json()

    // ── 2. Fetch Google profile ────────────────────────────────────────────────
    const profileRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    )

    if (!profileRes.ok) {
      return NextResponse.redirect(
        new URL('/auth?error=profile_fetch_failed', request.url)
      )
    }

    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
    } = await profileRes.json()

    if (!googleId || !email) {
      return NextResponse.redirect(
        new URL('/auth?error=missing_profile_data', request.url)
      )
    }

    // ── 3. Find or create user ─────────────────────────────────────────────────
    console.log('[v0] Looking up user by Google ID:', googleId)
    let user = await getUserByGoogleId(googleId)

    if (!user) {
      console.log('[v0] User not found, checking by email:', email)
      const existing = await getUserByEmail(email)
      if (existing) {
        console.log('[v0] User exists by email, updating with Google ID')
        user = await updateUser(existing.id, { google_id: googleId })
      } else {
        console.log('[v0] Creating new user')
        user = await createUser({
          email,
          google_id: googleId,
          first_name: firstName ?? null,
          last_name: lastName ?? null,
        })
      }
    } else {
      console.log('[v0] User found by Google ID')
    }

    if (!user) {
      console.error('[v0] User creation failed for:', email)
      return NextResponse.redirect(
        new URL('/auth?error=user_creation_failed', request.url)
      )
    }

    // ── 4. Create session ──────────────────────────────────────────────────────
    console.log('[v0] Creating session for user:', user.id)
    const sessionToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await createSession(user.id, sessionToken, expiresAt)
    console.log('[v0] Session created successfully')

    // ── 5. Determine chat destination based on active subscription ─────────────
    let chatDestination = '/chat' // default (starter / free)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseKey) {
        const subRes = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${user.id}&status=eq.active&order=end_date.desc&limit=1`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
        if (subRes.ok) {
          const subs = await subRes.json()
          const activePlan = subs?.[0]?.plan_type as string | undefined
          if (activePlan === 'vip') chatDestination = '/chat-vip'
          else if (activePlan === 'pro') chatDestination = '/chat-pro'
          else if (activePlan === 'starter') chatDestination = '/chat-starter'
        }
      }
    } catch {
      // Subscription lookup failed — fall back to /chat
    }

    // ── 6. Set cookies and redirect ────────────────────────────────────────────
    console.log('[v0] Google OAuth successful for user:', user.email)
    console.log('[v0] Redirecting to:', chatDestination)
    
    const res = NextResponse.redirect(new URL(chatDestination, request.url))

    // httpOnly — for server-side verification
    res.cookies.set('auth_token', sessionToken, {
      ...COOKIE_OPTS,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })

    // Readable by JS — AuthContext reads this on first render
    res.cookies.set('auth_token_client', sessionToken, {
      ...COOKIE_OPTS,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    })

    console.log('[v0] Cookies set, session token:', sessionToken.substring(0, 20) + '...')

    return res
  } catch (err) {
    console.error('[v0] Google callback unexpected error:', err)
    return NextResponse.redirect(
      new URL('/auth?error=server_error', request.url)
    )
  }
}

/**
 * POST — legacy endpoint for direct JWT calls from the frontend.
 */
export async function POST(request: NextRequest) {
  try {
    const { googleId, email, firstName, lastName } = await request.json()

    if (!googleId || !email) {
      return NextResponse.json(
        { error: 'googleId and email are required' },
        { status: 400 }
      )
    }

    let user = await getUserByGoogleId(googleId)

    if (!user) {
      const existing = await getUserByEmail(email)
      if (existing) {
        user = await updateUser(existing.id, { google_id: googleId })
      } else {
        user = await createUser({
          email,
          google_id: googleId,
          first_name: firstName ?? null,
          last_name: lastName ?? null,
        })
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'فشل معالجة تسجيل الدخول عبر Google' },
        { status: 500 }
      )
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await createSession(user.id, token, expiresAt)

    const { password_hash, ...userResponse } = user
    return NextResponse.json({ user: userResponse, token, expiresAt: expiresAt.toISOString() })
  } catch (err) {
    console.error('[v0] Google POST callback error:', err)
    return NextResponse.json(
      { error: 'فشل تسجيل الدخول عبر Google' },
      { status: 500 }
    )
  }
}
