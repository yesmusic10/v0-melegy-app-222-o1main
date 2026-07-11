import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getConversationMessages } from '@/app/actions/conversations'
import { ChatWindow } from '@/components/chat-window'

interface ChatPageProps {
  params: {
    id: string
  }
}

export const metadata = {
  title: 'Chat',
  description: 'Continue your conversation',
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const messages = await getConversationMessages(params.id)

  return <ChatWindow conversationId={params.id} initialMessages={messages} />
}
