/**
 * lib/melegy-router.ts
 * الـ Router الذكي لـ Melegy - يحلل الطلب ويوجهه للـ model المناسب
 * بسرعة عالية جداً (أقل من 2 ثانية)
 */

import { generateWithFalRouter } from "./falRouterService"
import { MELEGY_SYSTEM_PROMPT, MELEGY_CAPABILITIES } from "./melegy-system-prompt"
import { shouldPerformWebSearch } from "./web-search-service"
import { generateImage } from "./image-generation-service"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

/**
 * استخراج صورة من الرد إذا كانت موجودة
 */
function extractImageUrl(response: string): { text: string; imageUrl?: string } {
  const urlRegex = /https?:\/\/[^\s\n]+\.(png|jpg|jpeg|gif|webp)/gi
  const match = response.match(urlRegex)
  
  if (match && match[0]) {
    const imageUrl = match[0]
    const text = response.replace(imageUrl, "").trim()
    return { text, imageUrl }
  }
  
  return { text: response }
}

/**
 * تحليل سريع جداً لنوع الطلب (بدون API calls)
 * بناء على كلمات مفتاحية - أسرع من JSON parsing
 */
function quickTaskTypeAnalysis(input: string): string {
  const lower = input.toLowerCase()

  // Web Search - أولوية عالية للأخبار والمعلومات الحديثة
  if (shouldPerformWebSearch(input)) {
    return "web_search"
  }

  // PPT/Presentation - أعطيه أولوية عالية
  if (
    lower.includes("ppt") ||
    lower.includes("presentation") ||
    lower.includes("عرض") ||
    lower.includes("شرائح") ||
    lower.includes("slide") ||
    lower.includes("powerpoint") ||
    lower.includes("بوربوينت")
  ) {
    return "presentation"
  }

  // صور
  if (
    lower.includes("صورة") ||
    lower.includes("رسمة") ||
    lower.includes("صوّر") ||
    lower.includes("تصميم") ||
    lower.includes("صور") ||
    lower.includes("image") ||
    lower.includes("draw")
  ) {
    return lower.includes("عدّل") || lower.includes("غيّر")
      ? "image_edit"
      : "image_generation"
  }

  // كود - أعطيه أولوية عالية
  if (
    lower.includes("كود") ||
    lower.includes("برنامج") ||
    lower.includes("function") ||
    lower.includes("javascript") ||
    lower.includes("typescript") ||
    lower.includes("react") ||
    lower.includes("python") ||
    lower.includes("error") ||
    lower.includes("bug") ||
    lower.includes("debug") ||
    lower.includes("code")
  ) {
    return "code"
  }

  // ملفات Excel
  if (
    lower.includes("excel") ||
    lower.includes("جدول") ||
    lower.includes("spreadsheet") ||
    lower.includes("csv")
  ) {
    return "file_generation"
  }

  // ملفات عامة (ملف بدون excel)
  if (lower.includes("ملف")) {
    return "file_generation"
  }

  // SEO
  if (
    lower.includes("seo") ||
    lower.includes("محرك") ||
    lower.includes("البحث") ||
    lower.includes("optimization")
  ) {
    return "seo"
  }

  // Default
  return "general"
}

/**
 * الـ Router الموحد - الـ single entry point لـ Melegy
 * كل الطلبات تمر هنا، والـ user يرى Melegy فقط
 */
export async function routeMelegeRequest(
  userInput: string,
  conversationHistory: Message[],
  systemPrompt: string
): Promise<{ text: string; imageUrl?: string }> {
  try {
    // 1. تحليل سريع جداً للنوع
    const taskType = quickTaskTypeAnalysis(userInput)
    console.log(`[Melegy] Task: ${taskType}`)

    // 2. معالجة خاصة للصور
    if (taskType === "image_generation" || taskType === "image_edit") {
      try {
        const imageUrl = await generateImage(userInput)
        // استخراج URL من الرد
        const { text, imageUrl: extractedUrl } = extractImageUrl(imageUrl)
        return {
          text: text || "تم توليد الصورة بنجاح! هل تحب النتيجة؟",
          imageUrl: extractedUrl
        }
      } catch (error: any) {
        console.error("[Melegy Router] Image generation error:", error.message)
        return {
          text: "معلش! توليد الصور حالياً فيه مشكلة صغيرة. جرب وصف الصورة بطريقة مختلفة!"
        }
      }
    }

    // 3. اختيار الـ model الصحيح للمهام الأخرى
    const taskCapability = MELEGY_CAPABILITIES[taskType as keyof typeof MELEGY_CAPABILITIES] ||
      MELEGY_CAPABILITIES.general

    // 4. بناء الرسائل مع الـ context الكامل (آخر 10 رسائل فقط للسرعة)
    const messages: Message[] = [
      ...conversationHistory.slice(-10),
      { role: "user", content: userInput }
    ]

    // 5. استدعاء الـ model المناسب
    const response = await generateWithFalRouter(systemPrompt, messages, {
      model: taskCapability.model as string,
      maxTokens: taskType === "code" ? 2000 : taskType === "presentation" ? 4000 : 1500,
      temperature: taskType === "code" ? 0.2 : taskType === "presentation" ? 0.3 : 0.7
    })

    // 6. استخراج أي صور من الرد
    const { text, imageUrl } = extractImageUrl(response || "")

    // 7. إضافة المراجع من web search إذا كانت موجودة
    let finalText = text || "معلش حصل مشكلة، جرب تاني"
    
    // إذا كان هناك web search results، أضيف المراجع
    if (taskType === "web_search" && response?.includes("ref-badge")) {
      // الـ response بالفعل يحتوي على المراجع، ما حاجة لإضافة
      finalText = response
    }

    return {
      text: finalText,
      imageUrl
    }
  } catch (error: any) {
    console.error("[Melegy Router] Error:", error)
    return {
      text: "معلش حصل خطأ مؤقت، حاول تاني بعد شوية"
    }
  }
}

/**
 * التحقق من أسئلة "قدراتك" - رد خاص
 */
export function isCapabilitiesQuestion(prompt: string): boolean {
  const lower = prompt.toLowerCase()
  return (
    lower.includes("بتعرف تعمل ايه") ||
    lower.includes("قدراتك") ||
    lower.includes("إيه اللي بتقدر") ||
    lower.includes("what can you do")
  )
}

export { MELEGY_CAPABILITIES }
