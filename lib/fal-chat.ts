const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

// النماذج المتاحة
const MODEL_CHAT = "openai/gpt-oss-120b:free" // للردود النصية والدردشة العامة
const MODEL_FILES = "google/gemma-4-31b-it:free" // لطلب الملفات والعروض التقديمية
const MODEL_CODE = "z-ai/glm-4.5-air:free" // للكودينج وحلول البرمجة والـ SEO

export interface FalChatOptions {
  model?: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

/**
 * Call OpenRouter API directly with standard OpenAI format
 */
export async function falChat(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  options: FalChatOptions = {}
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY غير محدد في متغيرات البيئة")
  }

  const {
    model = MODEL_CHAT,
    systemPrompt,
    maxTokens = 600,
    temperature = 0.7,
  } = options

  // بناء قائمة الرسائل
  const messages: Array<{ role: string; content: string }> = []

  // إضافة رسالة النظام إذا كانت موجودة
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt })
  }

  // إضافة السجل
  if (history.length > 0) {
    const recent = history.slice(-8)
    messages.push(
      ...recent.map((m) => ({
        role: m.role,
        content: m.content,
      }))
    )
  }

  // إضافة رسالة المستخدم الحالية
  messages.push({ role: "user", content: userMessage })

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://melegy.app",
      "X-Title": "Melegy App",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return (data?.choices?.[0]?.message?.content || "").trim()
}
