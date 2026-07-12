import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Create email and password from user data (deterministic)
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@melegy.app`
    const password = `Melegy${birthDate}${name.length}!`

    const supabase = await createClient()

    try {
      // Try to sign in first
      let authUser = null
      let isNewUser = false

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInData?.user) {
        authUser = signInData.user
        console.log('[v0] Existing user logged in')
      } else if (signInError) {
        // Try to sign up if sign in fails
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim(),
              birthDate,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 'http://localhost:3000'}/auth/callback`,
          },
        })

        if (signUpError) {
          console.error('[v0] Signup error:', signUpError)
          return NextResponse.json({ message: 'Authentication failed' }, { status: 500 })
        }

        authUser = signUpData?.user
        isNewUser = true

        // Auto-confirm user for demo purposes
        if (authUser?.id) {
          try {
            await supabase.auth.admin.updateUserById(authUser.id, {
              email_confirm: true,
            })
            console.log('[v0] User auto-confirmed')
          } catch (confirmError) {
            console.log('[v0] Could not auto-confirm:', confirmError)
          }
        }
      }

      if (!authUser?.id) {
        return NextResponse.json({ message: 'Authentication failed' }, { status: 500 })
      }

      const userId = authUser.id

      // Store user info in userPhone table for reference
      try {
        const existing = await db
          .select()
          .from(userPhone)
          .where(eq(userPhone.id, userId))
          .limit(1)

        if (existing.length === 0) {
          // Create new user record
          await db.insert(userPhone).values({
            id: userId,
            phone: '',
            name: name.trim(),
            birthdate: birthDate,
            subscriptionplan: 'free',
            isverified: true,
          })

          // Create subscription
          const subscriptionId = nanoid()
          await db.insert(subscription).values({
            id: subscriptionId,
            userid: userId,
            plan: 'free',
            status: 'active',
            currentmonthusage: 0,
          })
        }
      } catch (dbError) {
        console.error('[v0] DB error (non-critical):', dbError)
        // Continue anyway - auth is more important
      }

      // Create response with JSON
      const response = NextResponse.json(
        {
          message: isNewUser ? 'Signup successful' : 'Login successful',
          userId,
          name: name.trim(),
          plan: 'free',
          redirectUrl: '/chat',
        },
        { status: 200 }
      )

      // Set userId cookie for client-side reference
      response.cookies.set('userId', userId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      })

      console.log('[v0] User authenticated:', userId, '- Session should be available')

      return response
    } catch (error) {
      console.error('[v0] Login error:', error)
      return NextResponse.json(
        { message: 'Authentication failed', error: String(error) },
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
