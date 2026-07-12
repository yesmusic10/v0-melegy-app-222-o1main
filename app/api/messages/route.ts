import { db } from '@/lib/db'
import { message, conversation } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, content, role, metadata } = await req.json()
    const id = nanoid()

    // Verify conversation belongs to user
    const conv = await db
      .select()
      .from(conversation)
      .where(and(eq(conversation.id, conversationId), eq(conversation.userid, userId)))

    if (conv.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const now = new Date()
    
    await db.insert(message).values({
      id,
      conversationid: conversationId,
      userid: userId,
      role: role || 'user',
      content,
      metadata,
      createdat: now,
    })

    // Update conversation's message count and updatedat
    await db
      .update(conversation)
      .set({
        messagecount: conv[0].messagecount + 1,
        updatedat: now,
      })
      .where(eq(conversation.id, conversationId))

    return Response.json({
      id,
      conversationId,
      userId,
      role: role || 'user',
      content,
      metadata,
      createdAt: now.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating message:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
