import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const { conversationId, content, role, metadata } = await req.json()
    const id = nanoid()

    // Verify conversation belongs to user
    const { data: conv, error: convError } = await supabase
      .from('conversation')
      .select()
      .eq('id', conversationId)
      .eq('userid', userId)
      .single()

    if (convError || !conv) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const now = new Date()
    
    // Insert message
    const { data: message, error: msgError } = await supabase
      .from('message')
      .insert({
        id,
        conversationid: conversationId,
        userid: userId,
        role: role || 'user',
        content,
        metadata,
        createdat: now,
      })
      .select()
      .single()

    if (msgError) {
      console.error('[v0] Error creating message:', msgError)
      return Response.json({ error: 'Failed to create message' }, { status: 500 })
    }

    // Update conversation's message count and updatedat
    const { error: updateError } = await supabase
      .from('conversation')
      .update({
        messagecount: (conv.messagecount || 0) + 1,
        updatedat: now,
      })
      .eq('id', conversationId)

    if (updateError) {
      console.error('[v0] Error updating conversation:', updateError)
    }

    return Response.json(message, { status: 201 })
  } catch (error) {
    console.error('[v0] Error in POST messages:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
