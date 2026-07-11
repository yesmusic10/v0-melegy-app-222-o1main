import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { message, conversation } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, content, role, metadata } = await req.json()
    const id = nanoid()

    // Verify conversation belongs to user
    const conv = await db
      .select()
      .from(conversation)
      .where(and(eq(conversation.id, conversationId), eq(conversation.userId, session.user.id)))

    if (conv.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const newMessage = await db.insert(message).values({
      id,
      conversationId,
      userId: session.user.id,
      role,
      content,
      metadata,
    })

    // Update conversation's message count and updatedAt
    await db
      .update(conversation)
      .set({
        messageCount: conv[0].messageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(conversation.id, conversationId))

    return Response.json({ id, role, content }, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating message:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
