/**
 * Request Enhancement Pipeline
 * تحسين الطلب قبل إرساله للموديل
 */

export interface EnhancedRequest {
  original: string
  enhanced: string
  taskType: string
  needsEnhancement: boolean
}

/**
 * تحديد ما إذا كان الطلب معقداً ويحتاج تحسين من prompt engineer
 */
export function isComplexRequest(input: string, taskType: string): boolean {
  // الطلبات العادية (دردشة عادية) لا تحتاج تحسين
  if (taskType === "general") {
    // تحقق من أن الطلب ليس سؤال عادي
    const simplePatterns = [
      /^(كيف|كيفك|أهلا|مرحبا|كيفك انت|وين|إيه أخبارك)/i,
      /^(how are you|hi|hello|what's up)/i,
      /^شنو|شلونك|شلون|كيفك/i,
    ]
    
    for (const pattern of simplePatterns) {
      if (pattern.test(input.trim())) {
        return false
      }
    }
    
    // أسئلة عامة مفتوحة = دردشة عادية
    if (input.length < 50) return false
  }
  
  // الطلبات المعقدة: صور، كود، عروض، بحث = تحتاج تحسين
  const complexTasks = ["image_generation", "image_edit", "code", "presentation", "file_generation", "seo"]
  if (complexTasks.includes(taskType)) {
    return true
  }
  
  return false
}

/**
 * تحسين الطلب عبر Prompt Engineer
 */
export async function enhanceRequest(
  userInput: string,
  taskType: string
): Promise<EnhancedRequest> {
  const needsEnhancement = isComplexRequest(userInput, taskType)
  
  if (!needsEnhancement) {
    return {
      original: userInput,
      enhanced: userInput,
      taskType,
      needsEnhancement: false,
    }
  }

  try {
    // استدعاء prompt engineer لتحسين الطلب
    const enhancedPrompt = await enhanceRequestWithAI(userInput, taskType)
    
    console.log("[v0] Request enhanced:", {
      original: userInput,
      enhanced: enhancedPrompt,
      taskType,
    })

    return {
      original: userInput,
      enhanced: enhancedPrompt,
      taskType,
      needsEnhancement: true,
    }
  } catch (error) {
    console.error("[v0] Failed to enhance request:", error)
    // إذا فشل التحسين، استخدم الطلب الأصلي
    return {
      original: userInput,
      enhanced: userInput,
      taskType,
      needsEnhancement: false,
    }
  }
}

/**
 * تحسين الطلب باستخدام AI
 */
async function enhanceRequestWithAI(userInput: string, taskType: string): Promise<string> {
  // مسجات مخصصة حسب نوع الطلب
  const enhancementPrompts: Record<string, string> = {
    image_generation: `أنت خبير في صياغة prompts لتوليد الصور. قم بتحسين الوصف التالي ليكون أكثر تفصيلاً واحترافية للاستخدام مع نماذج توليد الصور:
    
الوصف الأصلي: "${userInput}"

أرجع فقط الوصف المحسّن بدون تعليقات إضافية.`,

    code: `أنت خبير برمجي. قم بفهم المتطلب التالي وصياغة طلب واضح ومفصل للحصول على كود عالي الجودة:
    
المتطلب: "${userInput}"

أرجع طلباً مفصلاً يتضمن: اللغة المطلوبة، المتطلبات الوظيفية، أمثلة الاستخدام المتوقعة.`,

    presentation: `أنت خبير في تصميم العروض التقديمية. قم بتحسين طلب العرض التالي ليكون شاملاً واحترافياً:
    
الطلب: "${userInput}"

صِغ طلباً يتضمن: الموضوع الرئيسي، عدد الشرائح، الأقسام الرئيسية، نوع المحتوى (نصوص، أرقام، أمثلة).`,

    file_generation: `أنت خبير في إنشاء المستندات والجداول. قم بتحسين طلب الملف التالي:
    
الطلب: "${userInput}"

صِغ طلباً يتضمن: نوع الملف، البيانات المطلوبة، الهيكل المتوقع، أي متطلبات تنسيق خاصة.`,

    web_search: `أنت خبير في البحث والمعلومات. قم بصياغة استعلام بحث محسّن للحصول على أفضل النتائج:
    
الاستعلام الأصلي: "${userInput}"

أرجع استعلام محسّن يكون أكثر تحديداً ودقة.`,
  }

  const prompt = enhancementPrompts[taskType] || `تحسين الطلب: ${userInput}`

  try {
    // استخدام Groq (يجب أن يكون متوفراً في البيئة)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: "أنت مساعد متخصص في تحسين الطلبات والكتابة الاحترافية. قدّم ردود واضحة ومختصرة.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.choices[0].message.content.trim()
    }

    return userInput
  } catch (error) {
    console.error("[v0] AI enhancement failed:", error)
    return userInput
  }
}
