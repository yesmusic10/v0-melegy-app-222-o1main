'use client'

import ChatInterface from '@/components/chat-interface'
import { useEffect, useState } from 'react'

export default function ChatPage() {
  const [userId, setUserId] = useState<string>('user-' + Date.now())
  const [userName, setUserName] = useState<string>('مستخدم')

  useEffect(() => {
    // Generate or retrieve user ID from session storage (per-session only)
    const sessionUserId = sessionStorage.getItem('userId') || 'user-' + Date.now()
    sessionStorage.setItem('userId', sessionUserId)
    setUserId(sessionUserId)
  }, [])

  return <ChatInterface userId={userId} userName={userName} />
}
