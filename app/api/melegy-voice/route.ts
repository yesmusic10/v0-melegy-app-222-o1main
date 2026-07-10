/**
 * app/api/melegy-voice/route.ts
 * API endpoint للدردشة الصوتية - يجمع بين Melegy AI و ELEVENLABS
 * المستخدم يسمع صوت Hammam المصري
 */

import { NextRequest, NextResponse } from "next/server"
import { routeMelegeRequest } from "@/lib/melegy-router"
import { MELEGY_SYSTEM_PROMPT } from "@/lib/melegy-system-prompt"
import { textToSpeechEgyptian, VOICE_SETTINGS } from "@/lib/elevenlabs-service"

interface VoiceChatRequest {
  transcribedText: string // النص المحول من الصوت
  conversationHistory: Array<{ role: string; content: string }>
  includeAudio?: boolean // هل نرجع صوت أيضاً
  voiceStyle?: "natural" | "expressive" | "formal" | "casual"
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VoiceChatRequest
    const {
      transcribedText,
      conversationHistory = [],
      includeAudio = true,
      voiceStyle = "natural"
    } = body

    if (!transcribedText || typeof transcribedText !== "string") {
      return NextResponse.json(
        { error: "Invalid transcribed text" },
        { status: 400 }
      )
    }

    console.log(`[Voice Chat] Received: "${transcribedText.substring(0, 50)}"`)

    // 1. الحصول على رد من Melegy
    const melegeResponse = await routeMelegeRequest(
      transcribedText,
      conversationHistory as any,
      MELEGY_SYSTEM_PROMPT
    )

    // 2. تحويل الرد لصوت إذا طلب المستخدم ذلك
    let audioUrl: string | null = null

    if (includeAudio && melegeResponse) {
      try {
        const voiceSettings = VOICE_SETTINGS[voiceStyle] || VOICE_SETTINGS.natural
        const audioBuffer = await textToSpeechEgyptian(melegeResponse, voiceSettings)

        // تحويل الـ buffer لـ base64
        const audioBase64 = Buffer.from(audioBuffer).toString("base64")
        audioUrl = `data:audio/mpeg;base64,${audioBase64}`

        console.log(`[Voice Chat] Audio generated (${audioBuffer.byteLength} bytes)`)
      } catch (audioError: any) {
        console.error("[Voice Chat] Audio generation failed:", audioError.message)
        // نستمر بدون الصوت بدلاً من الفشل الكامل
      }
    }

    return NextResponse.json({
      success: true,
      text: melegeResponse,
      audio: audioUrl,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("[Voice Chat API] Error:", error.message)
    return NextResponse.json(
      { error: "معلش حصل خطأ، جرب تاني 😅" },
      { status: 500 }
    )
  }
}

// OPTIONS للـ CORS
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  })
}
