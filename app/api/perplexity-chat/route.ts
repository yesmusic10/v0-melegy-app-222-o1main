import { NextRequest, NextResponse } from "next/server"
import { routeMelegeRequest } from "@/lib/melegy-router"
import { MELEGY_SYSTEM_PROMPT } from "@/lib/melegy-system-prompt"
import { generateWithFalRouterVision } from "@/lib/falRouterService"

function stripMarkdown(text: string): string {
  // ألا تمس الجداول والمراجع - احفظهم كما هم
  const hasTable = text.includes("|") || text.includes("<table")
  const hasReferences = text.includes("ref-badge") || text.includes("web-search-references")
  
  let result = text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_{1,2}(.+?)_{1,2}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^\[\s]*[-*•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return result
}

const EGYPTIAN_SYSTEM_PROMPT = MELEGY_SYSTEM_PROMPT

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, message, conversationHistory = [], imageUrl, clientDateTime } = body
    const userPrompt = prompt || message

    if (!userPrompt || typeof userPrompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 })
    }

    const dateTimeContext = clientDateTime
      ? `\n\nالتاريخ والوقت الحالي من جهاز المستخدم: ${clientDateTime}\nاستخدم هذا التاريخ والوقت دايماً لما حد يسأل عن التاريخ أو الوقت.`
      : ""

    const fullSystemPrompt = MELEGY_SYSTEM_PROMPT + dateTimeContext

    // Build messages array from history
    const messages: { role: "user" | "assistant"; content: string }[] = conversationHistory
      .filter((m: any) => (m.role === "user" || m.role === "assistant") && m.content?.trim())
      .map((m: any) => ({ role: m.role as "user" | "assistant", content: String(m.content) }))

    // If image provided, use vision path
    if (imageUrl) {
      try {
        const visionResponse = await generateWithFalRouterVision(
          fullSystemPrompt,
          userPrompt,
          imageUrl,
          { maxTokens: 600, temperature: 0.7, model: "google/gemma-4-31b-it:free" }
        )
        const cleanedText = stripMarkdown(visionResponse)
        return NextResponse.json({
          response: cleanedText || "معلش حصل مشكلة، جرب تاني 😅",
          detectedEmotion: "neutral",
          emotionScore: 0,
        })
      } catch (e: any) {
        console.error("[API] Vision error:", e.message)
      }
    }

    // Use Melegy Router for intelligent task routing
    const routerResponse = await routeMelegeRequest(
      userPrompt,
      messages,
      fullSystemPrompt
    )

    const cleanedText = stripMarkdown(routerResponse.text)

    return NextResponse.json({
      response: cleanedText || "معلش حصل مشكلة، جرب تاني",
      imageUrl: routerResponse.imageUrl || null,
      detectedEmotion: "neutral",
      emotionScore: 0,
    })
  } catch (error: any) {
    console.error("[API] Error:", error.message)
    return NextResponse.json({ error: "معلش حصل مشكلة، جرب تاني 😅" }, { status: 500 })
  }
}
