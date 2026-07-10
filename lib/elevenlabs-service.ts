/**
 * lib/elevenlabs-service.ts
 * تحويل النصوص لصوت مصري احترافي باستخدام ELEVENLABS
 * صوت Hammam المصري الطبيعي
 */

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const HAMMAM_VOICE_ID = "EXAVITQu4vr4xnSDxMaL" // صوت Hammam المصري

interface ElevenLabsOptions {
  stability?: number
  similarity_boost?: number
  style?: number
}

/**
 * تحويل النص لصوت مصري احترافي
 * يستخدم صوت Hammam الطبيعي والمعبّر
 */
export async function textToSpeechEgyptian(
  text: string,
  options: ElevenLabsOptions = {}
): Promise<ArrayBuffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY not configured")
  }

  const {
    stability = 0.5,
    similarity_boost = 0.75,
    style = 1
  } = options

  try {
    console.log(`[ElevenLabs] Converting to speech: "${text.substring(0, 50)}..."`)

    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${HAMMAM_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability,
            similarity_boost,
            style,
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`)
    }

    const audioBuffer = await response.arrayBuffer()
    console.log(`[ElevenLabs] Audio generated successfully (${audioBuffer.byteLength} bytes)`)

    return audioBuffer
  } catch (error: any) {
    console.error("[ElevenLabs] Error:", error.message)
    throw error
  }
}

/**
 * تحويل النص لـ audio blob للتشغيل المباشر في المتصفح
 */
export async function textToSpeechBlob(
  text: string,
  options?: ElevenLabsOptions
): Promise<Blob> {
  const audioBuffer = await textToSpeechEgyptian(text, options)
  return new Blob([audioBuffer], { type: "audio/mpeg" })
}

/**
 * تحويل النص لـ data URL للتشغيل الفوري
 */
export async function textToSpeechDataUrl(
  text: string,
  options?: ElevenLabsOptions
): Promise<string> {
  const audioBuffer = await textToSpeechEgyptian(text, options)
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" })
  return URL.createObjectURL(blob)
}

/**
 * دالة مساعدة - تجزئة النصوص الطويلة (ELEVENLABS له حد أقصى)
 */
export function chunkText(text: string, maxChunkLength: number = 500): string[] {
  const chunks: string[] = []
  let currentChunk = ""

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkLength) {
      currentChunk += sentence
    } else {
      if (currentChunk) chunks.push(currentChunk)
      currentChunk = sentence
    }
  }

  if (currentChunk) chunks.push(currentChunk)
  return chunks
}

/**
 * تحويل نصوص طويلة لصوت - يجزئ تلقائياً
 */
export async function textToSpeechLong(
  text: string,
  options?: ElevenLabsOptions
): Promise<Blob> {
  const chunks = chunkText(text)
  console.log(`[ElevenLabs] Processing ${chunks.length} chunks`)

  const audioBuffers: ArrayBuffer[] = []

  for (const chunk of chunks) {
    const buffer = await textToSpeechEgyptian(chunk, options)
    audioBuffers.push(buffer)
  }

  // دمج جميع الـ buffers
  const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.byteLength, 0)
  const combined = new Uint8Array(totalLength)

  let offset = 0
  for (const buffer of audioBuffers) {
    combined.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  }

  return new Blob([combined], { type: "audio/mpeg" })
}

export const VOICE_SETTINGS = {
  natural: { stability: 0.6, similarity_boost: 0.8 },
  expressive: { stability: 0.4, similarity_boost: 0.75, style: 2 },
  formal: { stability: 0.8, similarity_boost: 0.85 },
  casual: { stability: 0.5, similarity_boost: 0.7 }
}
