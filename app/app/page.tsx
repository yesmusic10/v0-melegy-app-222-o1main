import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getConversations } from '@/app/actions/conversations'
import { getOrCreateSubscription } from '@/app/actions/users'
import { ChatDashboard } from '@/components/chat-dashboard'

export const metadata = {
  title: 'Dashboard',
  description: 'Your chat conversations',
}

export default async function AppPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const conversations = await getConversations()
  const subscription = await getOrCreateSubscription()

  return (
    <ChatDashboard
      initialConversations={conversations}
      subscription={subscription}
      user={session.user}
    />
  )
}
