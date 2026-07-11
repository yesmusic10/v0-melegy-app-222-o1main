'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import ChatInterface from '@/components/chat-interface'
import { Loader2 } from 'lucide-react'

export default function ChatPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.user) {
      console.log('[v0] User not authenticated, redirecting to sign-in')
      setIsRedirecting(true)
      router.replace('/sign-in')
    }
  }, [session?.user, isPending, router])

  if (isPending || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-gray-500">جاري التحميل...</span>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return <ChatInterface userId={session.user.id} userName={session.user.name || session.user.email || 'User'} />
}
