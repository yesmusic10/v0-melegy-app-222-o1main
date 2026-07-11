'use server'

import { db } from '@/lib/db'
import { subscription, userPreference, userPhone } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

async function getUserId() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) throw new Error('Unauthorized')
  return userId
}

export async function getOrCreateSubscription() {
  const userId = await getUserId()

  let sub = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userid, userId))
    .then((res) => res[0])

  if (!sub) {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await db.insert(subscription).values({
      id,
      userid: userId,
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
    .where(eq(userPreference.userid, userId))
    .then((res) => res[0])

  if (!pref) {
    const id = `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await db.insert(userPreference).values({
      id,
      userid: userId,
      theme: 'light',
      language: 'en',
      emailnotifications: true,
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
  const userId = await getUserId()

  const userData = await db
    .select()
    .from(userPhone)
    .where(eq(userPhone.id, userId))
    .then((res) => res[0])

  return userData || null
}
