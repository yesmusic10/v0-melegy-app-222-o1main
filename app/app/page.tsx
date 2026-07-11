import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {session.user.name || 'User'}</h1>
        <p className="text-muted-foreground mb-8">Start a new conversation or explore pricing plans</p>

        <div className="grid gap-4">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Start a New Conversation</h2>
            <p className="text-muted-foreground mb-6">Begin chatting with our AI assistant</p>
            <Link href="/pricing">
              <Button>Open Chat</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
