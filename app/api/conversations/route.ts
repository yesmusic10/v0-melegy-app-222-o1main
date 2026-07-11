import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { conversation, message } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { nanoid } from 'nanoid'

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await db
      .select()
      .from(conversation)
      .where(eq(conversation.userId, session.user.id))
      .orderBy(desc(conversation.updatedAt))

    // Fetch messages for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await db.select().from(message).where(eq(message.conversationId, conv.id))
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
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, model, description } = await req.json()
    
    // Validate model
    const validModels = [
      'qwen-2.5-72b-instruct',
      'qwen-2.5-32b-instruct',
      'qwen-2.5-14b-instruct',
      'qwen-2.5-coder-32b-instruct',
      'qwen-2.5-7b-instruct',
    ]
    const selectedModel = validModels.includes(model) ? model : 'qwen-2.5-72b-instruct'
    
    const id = nanoid()
    const now = new Date()

    await db.insert(conversation).values({
      id,
      userId: session.user.id,
      title: title?.trim() || 'New Conversation',
      model: selectedModel,
      description: description?.trim(),
      createdAt: now,
      updatedAt: now,
    })

    return Response.json({
      id,
      userId: session.user.id,
      title: title?.trim() || 'New Conversation',
      model: selectedModel,
      description: description?.trim(),
      messageCount: 0,
      isArchived: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating conversation:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
