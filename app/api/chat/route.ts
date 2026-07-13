import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: google('gemini-3.5-flash'),
    system: `أنت مساعد ذكي متخصص في اللغة العربية. 
تجيب بشكل مفيد واحترافي وودود.
استخدم صيغة محترفة وسهلة الفهم.
إذا طُلب منك كتابة كود، قدمه بصيغة markdown مع تحديد اللغة.
تحافظ على السياق وتعتمد على رسائل سابقة إن وجدت.`,
    messages: messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })),
  })

  return result.toDataStreamResponse()
}
