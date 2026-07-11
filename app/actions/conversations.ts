'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { conversation, message, subscription } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Plan limits
const PLAN_LIMITS = {
  free: { conversations: 5, messagesPerDay: 20 },
  starter: { conversations: 20, messagesPerDay: 100 },
  pro: { conversations: 100, messagesPerDay: 1000 },
  vip: { conversations: 1000, messagesPerDay: 10000 },
}

export async function createConversation(title?: string) {
  const userId = await getUserId()

  // Check subscription and limits
  const sub = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .then((res) => res[0])

  if (!sub) throw new Error('No subscription found')

  const plan = (sub.plan as keyof typeof PLAN_LIMITS) || 'free'
  const limits = PLAN_LIMITS[plan]

  const conversationCount = await db
    .select()
    .from(conversation)
    .where(eq(conversation.userId, userId))
    .then((res) => res.length)

  if (conversationCount >= limits.conversations) {
    throw new Error(`You have reached the limit of ${limits.conversations} conversations for your plan`)
  }

  const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  await db.insert(conversation).values({
    id,
    userId,
    title: title || 'New Conversation',
    messageCount: 0,
  })

  return { id, title: title || 'New Conversation' }
}

export async function getConversations() {
  const userId = await getUserId()

  return db
    .select()
    .from(conversation)
    .where(and(eq(conversation.userId, userId), eq(conversation.isArchived, false)))
    .orderBy(desc(conversation.updatedAt))
}

export async function getConversationMessages(conversationId: string) {
  const userId = await getUserId()

  const conv = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, conversationId), eq(conversation.userId, userId)))
    .then((res) => res[0])

  if (!conv) throw new Error('Conversation not found')

  const messages = await db
    .select()
    .from(message)
    .where(eq(message.conversationId, conversationId))
    .orderBy(desc(message.createdAt))

  return messages.map((msg) => ({
    ...msg,
    role: msg.role as 'user' | 'assistant',
  }))
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, any>
) {
  const userId = await getUserId()

  // Verify conversation belongs to user
  const conv = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, conversationId), eq(conversation.userId, userId)))
    .then((res) => res[0])

  if (!conv) throw new Error('Conversation not found')

  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  await db.insert(message).values({
    id,
    conversationId,
    userId,
    role,
    content,
    metadata: metadata ? JSON.stringify(metadata) : null,
  })

  // Update message count
  await db
    .update(conversation)
    .set({ messageCount: conv.messageCount + 1, updatedAt: new Date() })
    .where(eq(conversation.id, conversationId))

  return { id, role, content }
}

export async function deleteConversation(conversationId: string) {
  const userId = await getUserId()

  const conv = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, conversationId), eq(conversation.userId, userId)))
    .then((res) => res[0])

  if (!conv) throw new Error('Conversation not found')

  // Delete all messages in conversation
  await db.delete(message).where(eq(message.conversationId, conversationId))

  // Delete conversation
  await db.delete(conversation).where(eq(conversation.id, conversationId))
}

export async function archiveConversation(conversationId: string) {
  const userId = await getUserId()

  const conv = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, conversationId), eq(conversation.userId, userId)))
    .then((res) => res[0])

  if (!conv) throw new Error('Conversation not found')

  await db
    .update(conversation)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(conversation.id, conversationId))
}
