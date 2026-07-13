'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Send,
  Menu,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader,
  Smile,
} from 'lucide-react'

interface Conversation {
  id: string
  title: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

export default function ChatInterface({ userId, userName }: { userId: string; userName: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch(`/api/conversations?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
          if (data.conversations.length > 0 && !currentConversationId) {
            setCurrentConversationId(data.conversations[0].id)
          }
        }
      } catch (error) {
        console.error('[v0] Failed to load conversations:', error)
      }
    }

    loadConversations()
  }, [userId, currentConversationId])

  // Create new conversation
  const createNewConversation = async () => {
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `محادثة جديدة`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newConversation = { id: data.id, title: data.title, messages: [] }
        setConversations([newConversation, ...conversations])
        setCurrentConversationId(data.id)
        return data.id
      }
    } catch (error) {
      console.error('[v0] Error creating conversation:', error)
    }
    return null
  }

  // Delete conversation
  const deleteConversation = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
      const remaining = conversations.filter((c) => c.id !== id)
      setConversations(remaining)
      if (currentConversationId === id) {
        setCurrentConversationId(remaining[0]?.id || null)
      }
    } catch (error) {
      console.error('[v0] Failed to delete conversation:', error)
    }
  }

  // Update conversation title
  const updateConversationTitle = async (id: string, title: string) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      setConversations(
        conversations.map((c) => (c.id === id ? { ...c, title } : c))
      )
      setEditingTitle(null)
    } catch (error) {
      console.error('[v0] Failed to update title:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    let convId = currentConversationId
    if (!convId) {
      convId = await createNewConversation()
      if (!convId) return
    }

    const userMessage = { role: 'user', content: inputValue }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('0:"')) {
              const text = line.slice(3, -1)
              assistantMessage += text
              setMessages((prev) => {
                const updated = [...prev]
                if (updated[updated.length - 1]?.role === 'assistant') {
                  updated[updated.length - 1].content = assistantMessage
                } else {
                  updated.push({ role: 'assistant', content: assistantMessage })
                }
                return updated
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('[v0] Error sending message:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'حدث خطأ في الاتصال. حاول مرة أخرى.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle textarea auto-expand
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  // Copy message to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const currentConversation = conversations.find((c) => c.id === currentConversationId)

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950" dir="rtl">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-64' : 'w-0'
        } transition-all duration-200 border-l border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden flex flex-col`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            دردشة جديدة
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`mx-2 my-1 p-2 rounded-lg cursor-pointer group transition-colors ${
                currentConversationId === conversation.id
                  ? 'bg-gray-100 dark:bg-zinc-800'
                  : 'hover:bg-gray-100 dark:hover:bg-zinc-800/50'
              }`}
              onClick={() => setCurrentConversationId(conversation.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className="flex-1 min-w-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingTitle(conversation.id)
                    setNewTitle(conversation.title)
                  }}
                >
                  {editingTitle === conversation.id ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => {
                        if (newTitle.trim()) {
                          updateConversationTitle(conversation.id, newTitle)
                        } else {
                          setEditingTitle(null)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (newTitle.trim()) {
                            updateConversationTitle(conversation.id, newTitle)
                          }
                        } else if (e.key === 'Escape') {
                          setEditingTitle(null)
                        }
                      }}
                      autoFocus
                      className="w-full px-2 py-1 text-sm rounded border border-blue-500 dark:bg-zinc-700 dark:text-white bg-white"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {conversation.title}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conversation.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Melegy AI Assistant
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-zinc-800">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentConversation?.title || 'أبدأ محادثة جديدة'}
          </h1>

          <div className="w-10" />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="mb-6 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Smile className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                مرحباً بك في Melegy
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                أنا مساعدك الذكي. يمكنك أن تسألني عن أي شيء وسأساعدك بأفضل طريقة ممكنة.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  'شرح موضوع معقد',
                  'كتابة كود برمجي',
                  'تحليل نص',
                  'توليد أفكار إبداعية',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion)
                      inputRef.current?.focus()
                    }}
                    className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm text-gray-700 dark:text-gray-300 text-right"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-sm text-white ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                        : 'bg-gradient-to-br from-green-500 to-emerald-500'
                    }`}
                  >
                    {message.role === 'user' ? 'أنت' : 'M'}
                  </div>

                  <div className="flex-1 group relative">
                    <div
                      className={`px-4 py-3 rounded-lg max-w-2xl whitespace-pre-wrap ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-none'
                      }`}
                    >
                      {message.content}
                    </div>
                    <button
                      onClick={() => copyToClipboard(message.content, index.toString())}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-all ml-2"
                    >
                      {copiedId === index.toString() ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-sm text-white bg-gradient-to-br from-green-500 to-emerald-500">
                    M
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Loader className="w-4 h-4 animate-spin" />
                    جاري الكتابة...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="px-6 py-6 border-t border-gray-200 dark:border-zinc-800">
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    const fakeEvent = new Event('submit') as any
                    fakeEvent.preventDefault = () => {}
                    handleSendMessage(fakeEvent)
                  }
                }}
                placeholder="اكتب رسالتك هنا... (Shift+Enter للسطر الجديد)"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 resize-none max-h-48 placeholder-gray-400"
                rows={1}
                style={{ minHeight: '52px' }}
              />
              <button
                type="button"
                onClick={() => handleSendMessage({ preventDefault: () => {} } as any)}
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
              Melegy يستخدم Gemini AI. يرجى مراجعة سياسة الخصوصية قبل المتابعة.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
