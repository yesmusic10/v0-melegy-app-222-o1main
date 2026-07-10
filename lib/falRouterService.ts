const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

// النماذج المتاحة
const MODEL_CHAT = "openai/gpt-oss-120b:free" // للردود النصية والدردشة العامة
const MODEL_FILES = "google/gemma-4-31b-it:free" // لطلب الملفات والعروض التقديمية
const MODEL_CODE = "z-ai/glm-4.5-air:free" // للكودينج وحلول البرمجة والـ SEO
const MODEL_EMBED = "nvidia/llama-nemotron-embed-vl-1b-v2:free" // لتوليد الملفات
const MODEL_IMAGE = "sourceful/riverflow-v2.5-pro:free" // لتوليد وتعديل الصور

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

/**
 * Call OpenRouter API directly with streaming support
 */
export async function falRouterFetch(
  systemPrompt: string,
  messages: Message[],
  options: { maxTokens?: number; temperature?: number; model?: string } = {}
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY غير محدد في متغيرات البيئة")
  }

  const { maxTokens = 500, temperature = 0.7, model = MODEL_CHAT } = options

  // تحضير الرسائل بصيغة OpenAI القياسية
  const requestMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

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
      messages: requestMessages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return (data?.choices?.[0]?.message?.content || "").trim()
}

export async function generateWithFalRouter(
  systemPrompt: string,
  messages: Message[],
  options: { maxTokens?: number; temperature?: number; model?: string } = {}
): Promise<string> {
  try {
    return await falRouterFetch(systemPrompt, messages, options)
  } catch (error: any) {
    console.error("[OpenRouter] Error:", error.message)
    return "عذراً، حصل خطأ في الاتصال. جرب تاني بعد شوية."
  }
}

export async function generateWithFalRouterVision(
  systemPrompt: string,
  userPrompt: string,
  imageUrl: string,
  options: { maxTokens?: number; temperature?: number; model?: string } = {}
): Promise<string> {
  // الصور لا تُدعم مباشرة في OpenRouter بالطريقة ذاتها
  // نرسل الرابط في النص
  const messages: Message[] = [
    { role: "user", content: `${userPrompt}\n\n[صورة: ${imageUrl}]` },
  ]
  try {
    return await falRouterFetch(systemPrompt, messages, options)
  } catch (error: any) {
    console.error("[OpenRouter Vision] Error:", error.message)
    return "عذراً، حصل خطأ في تحليل الصورة. جرب تاني."
  }
}

export async function generateStreamingWithFalRouter(
  systemPrompt: string,
  messages: Message[],
  options: { maxTokens?: number; temperature?: number; model?: string } = {}
): Promise<ReadableStream<Uint8Array>> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY غير محدد")
  }

  const { maxTokens = 500, temperature = 0.7, model = MODEL_CHAT } = options
  const encoder = new TextEncoder()

  // تحضير الرسائل
  const requestMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://melegy.app",
      "X-Title": "Melegy App",
    },
    body: JSON.stringify({
      model,
      messages: requestMessages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`)
  }

  if (!response.body) {
    throw new Error("No response body from OpenRouter API")
  }

  // العودة المباشرة من generateStreamingResponse
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")

          // معالجة جميع الأسطر المكتملة
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim()

            if (line === "" || line === "[DONE]") {
              continue
            }

            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.substring(6)
                const chunk = JSON.parse(jsonStr)

                if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
                  const text = chunk.choices[0].delta.content
                  if (text) {
                    controller.enqueue(encoder.encode(text))
                  }
                }
              } catch (parseError) {
                console.error("[v0] Error parsing OpenRouter chunk:", parseError)
              }
            }
          }

          // الاحتفاظ بالسطر الأخير غير المكتمل في المخزن المؤقت
          buffer = lines[lines.length - 1]
        }

        controller.close()
      } catch (error) {
        console.error("[v0] Stream processing error:", error)
        const errorMsg = "آسف، في مشكلة مؤقتة. جرب تاني بعد شوية"
        controller.enqueue(encoder.encode(errorMsg))
        controller.close()
      }
    },
  })
}
