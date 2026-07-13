'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Send, Menu, Plus, Settings, Moon, Sun, Trash2, Copy, Check, ArrowUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Conversation {
  id: string
  title: string
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>
}

export default function ChatInterface({ userId, userName }: { userId: string; userName: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, input, setInput, append, isLoading, reload } = useChat({
    api: '/api/chat',
    id: currentConversationId || undefined,
    onFinish: async (message) => {
      if (currentConversationId && messages.length > 0) {
        // Save conversation after response
        await fetch(`/api/conversations/${currentConversationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, message],
          }),
        })
      }
    },
  })

  // Scroll to bottom
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
        const response = await fetch('/api/conversations')
        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
          if (data.conversations.length > 0 && !currentConversationId) {
            setCurrentConversationId(data.conversations[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to load conversations:', error)
      }
    }

    loadConversations()
  }, [userId])

  // Create new conversation
  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `محادثة - ${new Date().toLocaleDateString('ar-EG')}`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newConversation = { id: data.id, title: data.title, messages: [] }
        setConversations([newConversation, ...conversations])
        setCurrentConversationId(newConversation.id)
        setInput('')
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Create new conversation if needed
    if (!currentConversationId) {
      createNewConversation().then(() => {
        // Message will be sent in next render
      })
      return
    }

    append({
      role: 'user',
      content: input,
    })

    setInput('')
  }

  // Delete conversation
  const deleteConversation = async (convId: string) => {
    try {
      await fetch(`/api/conversations/${convId}`, { method: 'DELETE' })
      setConversations(conversations.filter((c) => c.id !== convId))
      if (currentConversationId === convId) {
        setCurrentConversationId(null)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  // Copy message
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-64' : 'w-0'
        } ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} border-r transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* New Chat Button */}
        <div className="p-3 border-b border-gray-800">
          <button
            onClick={createNewConversation}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>محادثة جديدة</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                currentConversationId === conv.id
                  ? isDark
                    ? 'bg-gray-700'
                    : 'bg-gray-200'
                  : isDark
                    ? 'hover:bg-gray-800'
                    : 'hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => setCurrentConversationId(conv.id)}
                className="w-full text-left truncate text-sm font-medium"
                title={conv.title}
              >
                {conv.title}
              </button>
              <button
                onClick={() => deleteConversation(conv.id)}
                className={`opacity-0 group-hover:opacity-100 mt-1 text-xs transition-opacity ${
                  isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'
                }`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className={`p-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="text-sm font-medium truncate">{userName}</div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
          }`}
        >
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-lg font-semibold">ميليجي - Melegy AI</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">مرحباً بك في ميليجي</h2>
                <p className={`text-lg ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  كيف يمكنني مساعدتك اليوم؟
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? isDark
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : isDark
                          ? 'bg-gray-800 text-gray-100'
                          : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            code: ({ className, children, ...props }: any) => {
                              const match = /language-(\w+)/.exec(className || '')
                              const isInline = !className
                              return !isInline && match ? (
                                <SyntaxHighlighter
                                  style={atomDark}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              )
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}

                    <div
                      className={`flex items-center justify-between mt-2 text-xs gap-2 ${
                        message.role === 'user' ? 'text-blue-100' : isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}
                    >
                      <span>{formatDistanceToNow(new Date(), { locale: ar })}</span>
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="opacity-0 hover:opacity-100 transition-opacity"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className={`px-4 py-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} p-4`}>
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  handleSendMessage(e as any)
                }
              }}
              placeholder="اكتب رسالتك هنا..."
              className={`flex-1 px-4 py-3 rounded-lg border transition-colors resize-none max-h-32 ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400'
              } focus:outline-none`}
              rows={1}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !currentConversationId}
              className={`p-3 rounded-lg transition-colors ${
                isLoading || !input.trim() || !currentConversationId
                  ? isDark
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isDark
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
