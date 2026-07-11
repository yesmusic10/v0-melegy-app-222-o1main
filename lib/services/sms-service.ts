import { db } from '@/lib/db'
import { otpVerification, userPhone } from '@/lib/db/schema'
import { eq, gt } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP to phone (simulated - in production use Twilio or similar)
export async function sendOTPToPhone(phone: string, otp: string): Promise<boolean> {
  try {
    // In production, integrate with Twilio or Firebase SMS
    console.log(`[SMS] Sending OTP ${otp} to ${phone}`)
    console.log(`[SMS] ⚠️ DEVELOPMENT MODE: Show this code to user: ${otp}`)
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Simulate SMS sending - in production this would call Twilio API
    // await twilioClient.messages.create({
    //   body: `Your Melegy verification code is: ${otp}. Valid for 10 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // })
    
    return true
  } catch (error) {
    console.error('[SMS] Error sending OTP:', error)
    return false
  }
}

// Create and send OTP
export async function createAndSendOTP(phone: string): Promise<string | null> {
  try {
    // Delete previous OTPs for this phone
    await db.delete(otpVerification).where(eq(otpVerification.phone, phone))
    
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    const id = nanoid()
    await db.insert(otpVerification).values({
      id,
      phone,
      otp,
      expiresAt,
    })
    
    const sent = await sendOTPToPhone(phone, otp)
    if (!sent) {
      await db.delete(otpVerification).where(eq(otpVerification.id, id))
      return null
    }
    
    return id
  } catch (error) {
    console.error('[SMS] Error creating OTP:', error)
    return null
  }
}

// Verify OTP
export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  try {
    const [record] = await db
      .select()
      .from(otpVerification)
      .where(eq(otpVerification.phone, phone))
      .limit(1)
    
    if (!record) {
      return false
    }
    
    // Check if expired
    if (new Date() > record.expiresAt) {
      await db.delete(otpVerification).where(eq(otpVerification.id, record.id))
      return false
    }
    
    // Check attempts
    if (record.attempts >= 5) {
      await db.delete(otpVerification).where(eq(otpVerification.id, record.id))
      return false
    }
    
    // Verify OTP
    if (record.otp !== otp) {
      await db
        .update(otpVerification)
        .set({ attempts: record.attempts + 1 })
        .where(eq(otpVerification.id, record.id))
      return false
    }
    
    // OTP verified - delete it
    await db.delete(otpVerification).where(eq(otpVerification.id, record.id))
    
    // Mark user as verified
    await db
      .update(userPhone)
      .set({ isVerified: true })
      .where(eq(userPhone.phone, phone))
    
    return true
  } catch (error) {
    console.error('[SMS] Error verifying OTP:', error)
    return false
  }
}

// Create or get user by phone
export async function createUserFromPhone(
  phone: string,
  name: string,
  birthDate: string,
  subscriptionPlan: string = 'free'
): Promise<string | null> {
  try {
    // Check if user exists
    const existing = await db
      .select()
      .from(userPhone)
      .where(eq(userPhone.phone, phone))
      .limit(1)
    
    if (existing.length > 0) {
      return existing[0].id
    }
    
    // Create new user
    const userId = nanoid()
    await db.insert(userPhone).values({
      id: userId,
      phone,
      name,
      birthDate,
      subscriptionPlan,
      isVerified: false,
    })
    
    return userId
  } catch (error) {
    console.error('[SMS] Error creating user:', error)
    return null
  }
}

// Get user by phone
export async function getUserByPhone(phone: string) {
  try {
    const users = await db
      .select()
      .from(userPhone)
      .where(eq(userPhone.phone, phone))
    
    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error('[SMS] Error getting user:', error)
    return null
  }
}

// Get OTP for phone (for development/testing)
export async function getOTPForPhone(phone: string): Promise<string | null> {
  try {
    const records = await db
      .select()
      .from(otpVerification)
      .where(eq(otpVerification.phone, phone))
      .limit(1)
    
    return records.length > 0 ? records[0].otp : null
  } catch (error) {
    console.error('[SMS] Error getting OTP:', error)
    return null
  }
}
