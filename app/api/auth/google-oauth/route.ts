import { NextRequest, NextResponse } from 'next/server'

/**
 * Google OAuth initiation endpoint
 * Creates the authorization URL for user to login with Google
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google Client ID not configured' },
        { status: 500 }
      )
    }

    // Get the base URL from the request to ensure it matches what's registered in Google Console
    const { protocol, host } = request.nextUrl
    const baseUrl = `${protocol}//${host}`
    const redirectUri = `${baseUrl}/api/auth/google/callback`
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('[v0] Google OAuth error:', error)
    return NextResponse.json(
      { error: 'فشل في بدء تسجيل الدخول عبر Google' },
      { status: 500 }
    )
  }
}
