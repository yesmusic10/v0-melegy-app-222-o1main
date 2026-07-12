import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      console.log('[v0] No authenticated user')
      return Response.json({ conversations: [] })
    }

    const userId = user.id

    // Fetch conversations from Supabase
    const { data: conversations, error } = await supabase
      .from('conversation')
      .select('*')
      .eq('userid', userId)
      .order('updatedat', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching conversations:', error)
      return Response.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    // Fetch messages for each conversation
    const conversationsWithMessages = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: messages } = await supabase
          .from('message')
          .select('*')
          .eq('conversationid', conv.id)
        return { ...conv, messages: messages || [] }
      })
    )

    return Response.json({ conversations: conversationsWithMessages })
  } catch (error) {
    console.error('[v0] Error in GET conversations:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      console.log('[v0] No authenticated user for POST')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const { title, model, description } = await req.json()
    
    // Validate model
    const validModels = [
      'qwen-2.5-72b-instruct',
      'qwen-2.5-32b-instruct',
      'qwen-2.5-14b-instruct',
      'qwen-2.5-coder-32b-instruct',
      'qwen-2.5-7b-instruct',
    ]
    const selectedModel = validModels.includes(model) ? model : 'qwen-2.5-32b-instruct'
    
    const id = nanoid()
    const now = new Date()

    const { data: conversation, error } = await supabase
      .from('conversation')
      .insert({
        id,
        userid: userId,
        title: title?.trim() || 'New Conversation',
        model: selectedModel,
        description: description?.trim(),
        createdat: now,
        updatedat: now,
        messagecount: 0,
        isarchived: false,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating conversation:', error)
      return Response.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return Response.json(conversation, { status: 201 })
  } catch (error) {
    console.error('[v0] Error in POST conversations:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
