import { createAndSendOTP, createUserFromPhone, getOTPForPhone } from '@/lib/services/sms-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name, birthDate } = body

    // Validation
    if (!phone || !name || !birthDate) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Format and validate phone
    const formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.length < 10) {
      return NextResponse.json(
        { message: 'Invalid phone number' },
        { status: 400 }
      )
    }

    // Create user if doesn't exist
    const userId = await createUserFromPhone(formattedPhone, name, birthDate)
    if (!userId) {
      return NextResponse.json(
        { message: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create and send OTP
    const otpId = await createAndSendOTP(formattedPhone)
    if (!otpId) {
      return NextResponse.json(
        { message: 'Failed to send OTP' },
        { status: 500 }
      )
    }

    // Get the OTP for development/testing
    const otp = await getOTPForPhone(formattedPhone)

    return NextResponse.json(
      {
        message: 'OTP sent successfully',
        otpId,
        userId,
        // Return OTP in development for testing
        ...(process.env.NODE_ENV === 'development' && { otp }),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error sending OTP:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
