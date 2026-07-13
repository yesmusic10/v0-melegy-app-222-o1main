import { db } from '@/lib/db'
import { conversation, message } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId') || 'anonymous'

    const conversations = await db
      .select()
      .from(conversation)
      .where(eq(conversation.userid, userId))
      .orderBy(desc(conversation.updatedat))

    // Fetch messages for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await db.select().from(message).where(eq(message.conversationid, conv.id))
        return { ...conv, messages }
      })
    )

    return Response.json({ conversations: conversationsWithMessages })
  } catch (error) {
    console.error('[v0] Error fetching conversations:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId') || 'anonymous'

    const { title, description } = await req.json()
    
    const id = nanoid()
    const now = new Date()

    await db.insert(conversation).values({
      id,
      userid: userId,
      title: title?.trim() || 'New Conversation',
      model: 'gemini-3.5-flash',
      description: description?.trim(),
      createdat: now,
      updatedat: now,
    })

    return Response.json({
      id,
      userid: userId,
      title: title?.trim() || 'New Conversation',
      model: 'gemini-3.5-flash',
      description: description?.trim(),
      messagecount: 0,
      isArchived: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating conversation:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
