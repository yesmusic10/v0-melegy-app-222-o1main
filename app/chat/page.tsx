'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ChatInterface from '@/components/chat-interface'
import { Loader2 } from 'lucide-react'

export default function ChatPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem('userId')
    const name = localStorage.getItem('userName')
    const plan = localStorage.getItem('subscriptionPlan')

    if (!id) {
      router.replace('/auth/sign-up')
      return
    }

    setUserId(id)
    setUserName(name || 'مستخدم')
    setSubscriptionPlan(plan || 'free')
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-gray-500">جاري التحميل...</span>
        </div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  return <ChatInterface userId={userId} userName={userName || 'مستخدم'} />
}
