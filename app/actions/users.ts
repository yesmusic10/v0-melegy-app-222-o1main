'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscription, userPreference, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getOrCreateSubscription() {
  const userId = await getUserId()

  let sub = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .then((res) => res[0])

  if (!sub) {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await db.insert(subscription).values({
      id,
      userId,
      plan: 'free',
      status: 'active',
    })
    sub = await db
      .select()
      .from(subscription)
      .where(eq(subscription.id, id))
      .then((res) => res[0])
  }

  return sub
}

export async function getOrCreateUserPreference() {
  const userId = await getUserId()

  let pref = await db
    .select()
    .from(userPreference)
    .where(eq(userPreference.userId, userId))
    .then((res) => res[0])

  if (!pref) {
    const id = `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await db.insert(userPreference).values({
      id,
      userId,
      theme: 'light',
      language: 'en',
      emailNotifications: true,
    })
    pref = await db
      .select()
      .from(userPreference)
      .where(eq(userPreference.id, id))
      .then((res) => res[0])
  }

  return pref
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .then((res) => res[0])

  return userData
}
