import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { conversation } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Delete conversation only if it belongs to the user
    await db
      .delete(conversation)
      .where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))

    return Response.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting conversation:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
