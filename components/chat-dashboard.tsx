'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createConversation } from '@/app/actions/conversations'

interface Conversation {
  id: string
  title: string
  messageCount: number
  createdAt: Date
  updatedAt: Date
}

interface Subscription {
  id: string
  userId: string
  plan: string
  status: string
  currentMonthUsage: number
}

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface ChatDashboardProps {
  initialConversations: Conversation[]
  subscription: Subscription
  user: User
}

const PLAN_INFO = {
  free: {
    name: 'Free',
    color: 'bg-gray-100',
    conversations: 5,
    messagesPerDay: 20,
  },
  starter: {
    name: 'Starter',
    color: 'bg-blue-100',
    conversations: 20,
    messagesPerDay: 100,
  },
  pro: {
    name: 'Pro',
    color: 'bg-purple-100',
    conversations: 100,
    messagesPerDay: 1000,
  },
  vip: {
    name: 'VIP',
    color: 'bg-amber-100',
    conversations: 1000,
    messagesPerDay: 10000,
  },
}

export function ChatDashboard({
  initialConversations,
  subscription,
  user,
}: ChatDashboardProps) {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const planInfo = PLAN_INFO[subscription.plan as keyof typeof PLAN_INFO] || PLAN_INFO.free

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await createConversation(newTitle || undefined)
      setNewTitle('')
      
      const newConversation: Conversation = {
        id: result.id,
        title: result.title,
        messageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      setConversations((prev) => [newConversation, ...prev])
      router.push(`/app/chat/${result.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">Melegy</h1>
            <div className={`${planInfo.color} px-3 py-1 rounded-full text-sm font-semibold`}>
              {planInfo.name} Plan
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <p>{user.name}</p>
              <p className="text-xs">{user.email}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Plan Info */}
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Your Plan</h2>
              <p className="text-sm text-muted-foreground">
                {planInfo.conversations} conversations • {planInfo.messagesPerDay} messages/day
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/pricing')}
            >
              Upgrade Plan
            </Button>
          </div>
        </Card>

        {/* New Conversation */}
        <Card className="mb-6 p-4">
          <form onSubmit={handleCreateConversation} className="flex gap-2">
            <Input
              placeholder="Enter conversation title (optional)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'New Conversation'}
            </Button>
          </form>
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </Card>

        {/* Conversations List */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Your Conversations
          </h2>
          {conversations.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No conversations yet. Create your first one!
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/app/chat/${conv.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {conv.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {conv.messageCount} messages • Updated{' '}
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      →
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pricing CTA */}
        {subscription.plan === 'free' && (
          <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <h3 className="font-bold text-lg text-foreground mb-2">
              Upgrade to Pro
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unlock more conversations and unlimited messages with a paid plan
            </p>
            <Button onClick={() => router.push('/pricing')}>
              View Plans
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
