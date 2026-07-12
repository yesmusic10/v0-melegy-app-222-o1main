'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Menu, Plus, Settings, Moon, Sun, Trash2, Copy, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { addEgyptianFlavor, normalizeEgyptianText } from '@/lib/services/egyptianDialectService'
import { ConversationMemoryService } from '@/lib/services/conversationMemoryService'

// Declare Puter global
declare global {
  interface Window {
    puter?: any
  }
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
}

export default function ChatInterface({ userId, userName }: { userId: string; userName: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const puterRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize Puter.js
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.puter.com/puter.js'
    script.async = true
    
    script.onload = () => {
      console.log('[v0] Puter.js loaded successfully')
      if (window.puter) {
        puterRef.current = window.puter
      }
    }
    
    script.onerror = () => {
      console.error('[v0] Failed to load Puter.js from CDN')
      setIsLoading(false)
    }
    
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Load conversations from server
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch('/api/conversations')
        const data = await response.json()
        setConversations(data.conversations || [])

        if (data.conversations.length > 0 && !currentConversationId) {
          setCurrentConversationId(data.conversations[0].id)
          setMessages(data.conversations[0].messages || [])
        }
      } catch (error) {
        console.error('[v0] Error loading conversations:', error)
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
          title: `Conversation - ${new Date().toLocaleDateString('ar-EG')}`,
          model: 'qwen-2.5-32b-instruct', // Default model (will be auto-selected per message)
        }),
      })

      const data = await response.json()
      const newConversation = { id: data.id, title: data.title, messages: [] }
      setConversations([newConversation, ...conversations])
      setCurrentConversationId(newConversation.id)
      setMessages([])
      setInputValue('')
    } catch (error) {
      console.error('[v0] Error creating conversation:', error)
    }
  }

  // Send message to Puter AI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || !puterRef.current || !currentConversationId) return

    // Create new conversation if needed
    let convId = currentConversationId
    if (messages.length === 0) {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: inputValue.substring(0, 50),
          model: 'qwen-2.5-32b-instruct', // Default model (will be auto-selected per message)
        }),
      })
      const data = await response.json()
      convId = data.id
      setCurrentConversationId(convId)
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Save user message to DB
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          role: 'user',
          content: userMessage.content,
        }),
      })

      // Get chat history for context
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Load user context and conversation memory
      const userContext = await ConversationMemoryService.loadUserContext(userId, convId, chatHistory)
      
      // Extract facts to remember for future
      const facts = ConversationMemoryService.extractFactsToRemember(userMessage.content)

      // Build context-aware prompt with Egyptian personality
      const systemPrompt = ConversationMemoryService.buildContextAwarePrompt(userContext, userMessage.content)

      // Auto-select best model based on message content (silent in background)
      const bestModel = selectBestModel(userMessage.content)

      // Call Puter AI with auto-selected model
      const response = await puterRef.current.ai.chat(bestModel, [
        ...chatHistory,
        { role: 'user', content: userMessage.content },
      ])

      // Apply Egyptian dialect to response
      const egyptianizedResponse = addEgyptianFlavor(normalizeEgyptianText(response))

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: egyptianizedResponse,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Save assistant message to DB
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          role: 'assistant',
          content: assistantMessage.content,
        }),
      })
    } catch (error) {
      console.error('[v0] Error calling Puter AI:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `عذراً، حدث خطأ: ${error instanceof Error ? error.message : 'Unknown error'}`,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Delete conversation
  const deleteConversation = async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete conversation')
      }
      setConversations(conversations.filter((c) => c.id !== convId))
      if (currentConversationId === convId) {
        setCurrentConversationId(null)
        setMessages([])
      }
    } catch (error) {
      console.error('[v0] Error deleting conversation:', error)
      alert('فشل حذف المحادثة. حاول مرة أخرى.')
    }
  }

  // Copy message to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle file upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      // Auto-add file info to input
      setInputValue(`[File: ${file.name}] `)
    }
  }

  // Handle action menu selections
  const handleActionSelect = (action: string) => {
    switch (action) {
      case 'image':
        setInputValue('أنشئ صورة: ')
        break
      case 'video':
        setInputValue('أنشئ فيديو: ')
        break
      case 'analyze':
        if (uploadedFile) {
          setInputValue(`حلل ملف ${uploadedFile.name}: `)
        } else {
          setInputValue('حلل الملف: ')
        }
        break
      case 'code':
        setInputValue('اكتب كود: ')
        break
      case 'document':
        setInputValue('أنشئ مستند: ')
        break
    }
    setShowActionMenu(false)
  }

  // Auto-select best model based on message content (in background)
  const selectBestModel = (messageContent: string): string => {
    const lowerContent = messageContent.toLowerCase()
    
    // Code-related request - use Coder model
    if (/code|programming|python|javascript|javascript|react|html|css|function|debug|refactor/i.test(lowerContent)) {
      return 'qwen-2.5-coder-32b-instruct'
    }
    
    // Simple/quick question - use smaller model for faster response
    if (messageContent.split(' ').length <= 5) {
      return 'qwen-2.5-7b-instruct'
    }
    
    // Complex reasoning needed - use larger model
    if (/explain|analyze|comprehensive|detailed|think|problem|solution|why|how/i.test(lowerContent)) {
      return 'qwen-2.5-72b-instruct'
    }
    
    // Default to mid-range model for balanced performance
    return 'qwen-2.5-32b-instruct'
  }

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Sidebar */}
      <div
        className={`${showSidebar ? 'w-64' : 'w-0'} ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={createNewConversation}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>محادثة جديدة</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group p-3 rounded-lg cursor-pointer transition-all ${
                currentConversationId === conv.id
                  ? isDark
                    ? 'bg-blue-600'
                    : 'bg-blue-100'
                  : isDark
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => {
                  setCurrentConversationId(conv.id)
                  setMessages(conv.messages)
                }}
                className="w-full text-left truncate text-sm font-medium"
              >
                {conv.title}
              </button>
              <button
                onClick={() => deleteConversation(conv.id)}
                className={`opacity-0 group-hover:opacity-100 mt-1 text-xs transition-opacity ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-sm font-medium truncate">{userName}</div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Menu className="w-5 h-5" />
            </button>


          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">مرحباً في ميليجي</h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  ابدأ محادثة جديدة مع مساعدك الذكي
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? isDark
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : isDark
                          ? 'bg-gray-700 text-gray-100'
                          : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
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
                      className={`flex items-center justify-between mt-2 text-xs ${
                        message.role === 'user' ? 'text-blue-100' : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      <span>{formatDistanceToNow(message.createdAt, { locale: ar })}</span>
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
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
                  <div className={`px-4 py-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSendMessage}
          className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
        >
          {/* File upload indicator */}
          {uploadedFile && (
            <div className={`mb-3 p-2 rounded-lg flex items-center justify-between ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <span className="text-sm">{uploadedFile.name}</span>
              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                إزالة
              </button>
            </div>
          )}
          
          <div className="flex gap-2">
            {/* Action Menu Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionMenu(!showActionMenu)}
                className={`px-3 py-3 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                title="خيارات متقدمة"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              {/* Action Menu Dropdown */}
              {showActionMenu && (
                <div className={`absolute bottom-full left-0 mb-2 rounded-lg shadow-lg z-50 w-48 ${
                  isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-300'
                }`}>
                  <button
                    type="button"
                    onClick={() => handleActionSelect('image')}
                    className={`w-full text-right px-4 py-2 hover:${isDark ? 'bg-gray-600' : 'bg-gray-100'} transition-colors`}
                  >
                    صورة 🖼️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActionSelect('video')}
                    className={`w-full text-right px-4 py-2 hover:${isDark ? 'bg-gray-600' : 'bg-gray-100'} transition-colors`}
                  >
                    فيديو 🎬
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActionSelect('code')}
                    className={`w-full text-right px-4 py-2 hover:${isDark ? 'bg-gray-600' : 'bg-gray-100'} transition-colors`}
                  >
                    كود 💻
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActionSelect('document')}
                    className={`w-full text-right px-4 py-2 hover:${isDark ? 'bg-gray-600' : 'bg-gray-100'} transition-colors`}
                  >
                    مستند 📄
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActionSelect('analyze')}
                    className={`w-full text-right px-4 py-2 hover:${isDark ? 'bg-gray-600' : 'bg-gray-100'} transition-colors border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    حلل ملف 📊
                  </button>
                </div>
              )}
            </div>

            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-3 rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
              title="رفع ملف"
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="*"
            />

            {/* Chat Input */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="اكتب رسالتك..."
              disabled={isLoading}
              className={`flex-1 px-4 py-3 rounded-lg border transition-colors disabled:opacity-50 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
            />
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className={`px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
