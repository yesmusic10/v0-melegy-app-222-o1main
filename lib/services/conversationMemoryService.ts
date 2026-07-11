import { v4 as uuidv4 } from 'uuid'

// Note: Database operations should be done server-side via API calls
// This service handles memory, context, and Egyptian dialect processing

export interface UserProfile {
  userId: string
  name?: string
  nickname?: string
  location?: string
  interests?: string[]
  preferences?: Record<string, any>
  lastInteractionDate?: Date
  totalInteractions?: number
}

export interface ConversationContext {
  recentMessages: Array<{ role: string; content: string }>
  userProfile?: UserProfile
  conversationHistory?: Array<{ timestamp: Date; summary: string }>
  topics?: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
}

/**
 * Manages conversation memory and user context
 * Helps the AI remember previous conversations and user details
 */
export class ConversationMemoryService {
  /**
   * Load user profile and recent conversation context
   * Note: Call API endpoint to get messages, this runs client-side
   */
  static async loadUserContext(
    userId: string,
    conversationId?: string,
    recentMessages: Array<{ role: string; content: string }> = []
  ): Promise<ConversationContext> {
    try {
      // Extract topics and sentiment from provided messages
      const topics = this.extractTopics(recentMessages.map(m => m.content))
      const sentiment = this.analyzeSentiment(recentMessages.map(m => m.content))

      // Build user profile from interaction patterns
      const userProfile = this.buildUserProfileFromMessages(userId, recentMessages)

      return {
        recentMessages,
        userProfile,
        topics,
        sentiment,
      }
    } catch (error) {
      console.error('[v0] Error loading user context:', error)
      return { recentMessages: [] }
    }
  }

  /**
   * Build user profile from past conversations
   */
  private static buildUserProfileFromMessages(
    userId: string,
    recentMessages: Array<{ role: string; content: string }>
  ): UserProfile {
    try {
      // Extract name from first message if available
      const namePattern = /اسمي\s+(\w+)|أنا\s+(\w+)|أنت\s+تناديني\s+(\w+)/
      const firstMessageWithName = recentMessages.find(m => m.role === 'user' && namePattern.test(m.content))
      const nameMatch = firstMessageWithName?.content.match(namePattern)
      const name = nameMatch ? nameMatch[1] || nameMatch[2] || nameMatch[3] : undefined

      // Extract location/preferences
      const locationPattern = /من\s+([\w\s]+)|في\s+([\w\s]+)|ساكن\s+في\s+([\w\s]+)/
      const firstMessageWithLocation = recentMessages.find(m =>
        m.role === 'user' && locationPattern.test(m.content)
      )
      const locationMatch = firstMessageWithLocation?.content.match(locationPattern)
      const location = locationMatch ? locationMatch[1] || locationMatch[2] || locationMatch[3] : undefined

      // Extract interests
      const interests = this.extractInterests(recentMessages.map(m => m.content))

      return {
        userId,
        name,
        location,
        interests,
        preferences: {},
        totalInteractions: recentMessages.length,
        lastInteractionDate: new Date(),
      }
    } catch (error) {
      console.error('[v0] Error building user profile:', error)
      return { userId }
    }
  }

  /**
   * Extract topics from messages
   */
  private static extractTopics(messages: string[]): string[] {
    const topics: Set<string> = new Set()

    const topicKeywords: Record<string, string[]> = {
      'تقنية': ['برنامج', 'تطبيق', 'كمبيوتر', 'موقع', 'كود', 'python', 'javascript'],
      'رياضة': ['كرة', 'لعب', 'رياضة', 'ماتش', 'فريق', 'لاعب'],
      'أفلام': ['فيلم', 'سينما', 'ممثل', 'مسلسل', 'نتفليكس', 'اسطوانة'],
      'طعام': ['أكل', 'ذ وق', 'طبخ', 'مطعم', 'وجبة', 'طبيخ'],
      'سفر': ['سفر', 'مكان', 'دول', 'رحلة', 'سياحة', 'قضاء الإجازة'],
      'تعليم': ['دراسة', 'كتاب', 'معلومة', 'تعلم', 'مادة', 'امتحان'],
    }

    for (const message of messages) {
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => message.includes(keyword))) {
          topics.add(topic)
        }
      }
    }

    return Array.from(topics)
  }

  /**
   * Extract user interests from messages
   */
  private static extractInterests(messages: string[]): string[] {
    return this.extractTopics(messages) // Reuse topic extraction
  }

  /**
   * Analyze sentiment of messages
   */
  private static analyzeSentiment(messages: string[]): 'positive' | 'neutral' | 'negative' {
    let positiveCount = 0
    let negativeCount = 0

    const positiveWords = ['ممتاز', 'رائع', 'حلو', 'تمام', 'أحب', 'يسعدني', 'شكراً', 'يا سلام']
    const negativeWords = ['وحش', 'سيء', 'حزين', 'زعلان', 'تعبان', 'مكتئب', 'مزعج', 'يا خسارة']

    for (const message of messages) {
      positiveWords.forEach(word => {
        if (message.includes(word)) positiveCount++
      })
      negativeWords.forEach(word => {
        if (message.includes(word)) negativeCount++
      })
    }

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  /**
   * Save conversation context for future reference
   */
  static async saveConversationSummary(
    userId: string,
    conversationId: string,
    summary: string
  ): Promise<void> {
    try {
      // This can be extended to save to a separate summary table
      console.log('[v0] Saving conversation summary for user:', userId)
    } catch (error) {
      console.error('[v0] Error saving conversation summary:', error)
    }
  }

  /**
   * Generate a personalized greeting based on user history
   */
  static generatePersonalizedGreeting(userProfile?: UserProfile): string {
    if (!userProfile?.name) {
      return 'أهلا وسهلا يا معلم! إزيك انت النهاردة؟'
    }

    const greetings = [
      `أهلا ${userProfile.name}! إزيك يا معلم؟`,
      `السلام عليكم ورحمة الله يا ${userProfile.name}! كيفك أنت؟`,
      `يا ${userProfile.name} يا معلم! إزيك دلوقتي؟`,
      `الحمد لله على السلامة يا ${userProfile.name}! إزيك انت؟`,
    ]

    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  /**
   * Build context-aware prompt for AI
   */
  static buildContextAwarePrompt(userContext: ConversationContext, userMessage: string): string {
    let prompt = `أنت ميليجي، مساعد ذكي مصري يتحدث باللهجة المصرية العامية الحقيقية من شبرا.\n`
    prompt += `أسلوبك: ودود، فكاهي، طبيعي جداً كأنك شخص حقيقي من مصر.\n`
    prompt += `الاهتمامات: ${userContext.topics?.join(', ') || 'متنوعة'}\n`

    if (userContext.userProfile?.name) {
      prompt += `اسم المستخدم: ${userContext.userProfile.name}\n`
    }

    if (userContext.userProfile?.location) {
      prompt += `المكان: ${userContext.userProfile.location}\n`
    }

    prompt += `الحالة المزاجية: ${userContext.sentiment === 'positive' ? 'إيجابية' : userContext.sentiment === 'negative' ? 'سلبية' : 'محايدة'}\n`
    prompt += `\nالرسالة الأخيرة: ${userMessage}\n`
    prompt += `\nرد بطبيعية وببساطة، كأنك شخص بشري حقيقي من مصر. استخدم العامية المصرية بشكل طبيعي.`

    return prompt
  }

  /**
   * Extract and remember important facts
   */
  static extractFactsToRemember(message: string): Record<string, any> {
    const facts: Record<string, any> = {}

    // Extract name
    const nameMatch = message.match(/اسمي\s+(\w+)|أنا\s+(\w+)/)
    if (nameMatch) {
      facts.name = nameMatch[1] || nameMatch[2]
    }

    // Extract location
    const locationMatch = message.match(/من\s+([\w\s]+)|ساكن\s+في\s+([\w\s]+)/)
    if (locationMatch) {
      facts.location = locationMatch[1] || locationMatch[2]
    }

    // Extract age
    const ageMatch = message.match(/عمري\s+(\d+)|أنا\s+(\d+)\s+سنة/)
    if (ageMatch) {
      facts.age = ageMatch[1] || ageMatch[2]
    }

    // Extract job
    const jobMatch = message.match(/أنا\s+(\w+)|شغلي\s+(\w+)|أعمل\s+(\w+)/)
    if (jobMatch) {
      facts.job = jobMatch[1] || jobMatch[2] || jobMatch[3]
    }

    return facts
  }
}
