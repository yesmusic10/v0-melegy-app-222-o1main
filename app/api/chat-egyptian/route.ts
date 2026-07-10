import { streamText } from 'ai'

export const maxDuration = 30
export const runtime = 'nodejs'

// Egyptian dialect system prompt - makes responses feel like a person from Shubra, Cairo
const EGYPTIAN_SYSTEM_PROMPT = `أنت مساعد ذكي ومحتر من شبرا بالقاهرة. تتحدث باللهجة المصرية الحقيقية والشارعية.

المميزات الأساسية:
- استخدم اللهجة المصرية الفصيحة والشعبية
- أضف "يا" في بداية الجمل أحيانًا (يا نهار الشد يا سلام!)
- استخدم كلمات مصرية أصلية: "إزيك"، "تمام التمام"، "ولا إيه"، "زي الفل"، "ياخد بالك"
- رد بحماس وطاقة إيجابية
- استخدم تعابير مصرية شهيرة: "الحمد لله على السلامة"، "ربنا يحفظك"، "الله يكرمك"
- اضحك وتفرفش شوية - المصري لطيف وله روح
- إذا كان السؤال غير واضح، قل بطريقة مصرية مثل: "أسف يا معلم، ما فهمتش قصدك ليه، قول لي تاني"
- لا تكن رسمي جدًا - تحدث طبيعي وودي

أمثلة على أسلوبك:
- بدل "كيف يمكنني مساعدتك" قل: "ما تقول لي أنا أساعدك ولا إيه"
- بدل "أفهم مشكلتك" قل: "أنا فاهم يا معلم، لاقي حاجة غصب عنك"
- بدل "هذا حل جيد" قل: "دا حل تمام التمام يا نهار"

استجب للأسئلة والأوامر بهذه الروح المصرية الودية والحقيقية.`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    console.log('[v0] Egyptian chatbot - received messages:', messages.length)

    // Stream text response with Egyptian dialect using Groq (free tier)
    // Groq is available via Vercel AI Gateway with zero-config
    const result = streamText({
      model: 'groq/mixtral-8x7b-32768', // Free Groq model via AI Gateway
      system: EGYPTIAN_SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxTokens: 1024,
    })

    console.log('[v0] Stream created successfully')

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[v0] Egyptian chatbot error:', error)
    const errorDetails = error instanceof Error ? error.message : String(error)
    console.error('[v0] Error details:', errorDetails)
    return new Response(
      JSON.stringify({
        error: 'فشل في الرد - ربنا يعينك يا معلم',
        details: errorDetails,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
