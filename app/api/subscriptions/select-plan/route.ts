import { db } from '@/lib/db'
import { userPhone, subscription } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, plan } = body

    if (!userId || !plan) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate plan
    const validPlans = ['free', 'pro', 'enterprise']
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { message: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Update user subscription plan
    await db
      .update(userPhone)
      .set({
        subscriptionPlan: plan,
        updatedAt: new Date(),
      })
      .where(eq(userPhone.id, userId))

    // Create or update subscription record
    const existing = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))

    if (existing.length > 0) {
      // Update existing subscription
      await db
        .update(subscription)
        .set({
          plan,
          status: 'active',
          updatedAt: new Date(),
        })
        .where(eq(subscription.userId, userId))
    } else {
      // Create new subscription
      const subscriptionId = nanoid()
      await db.insert(subscription).values({
        id: subscriptionId,
        userId,
        plan,
        status: 'active',
        currentMonthUsage: 0,
      })
    }

    return NextResponse.json(
      {
        message: 'Plan selected successfully',
        userId,
        plan,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error selecting plan:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
