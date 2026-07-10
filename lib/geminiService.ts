import { generateStreamingResponse as generateStreamingFromNative } from "./geminiNativeService"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

/**
 * Generates a response using OpenRouter's native streaming service.
 * This is maintained for backward compatibility.
 */
export async function generateGeminiResponse(userInput: string, conversationHistory: Message[]): Promise<string> {
  const stream = await generateStreamingFromNative(userInput, conversationHistory)
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let fullResponse = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fullResponse += decoder.decode(value, { stream: true })
    }
  } finally {
    reader.releaseLock()
  }

  return fullResponse
}

/**
 * Streams the response using OpenRouter's native streaming API.
 * Redirects to the native service which uses the correct models.
 */
export async function generateStreamingResponse(
  userInput: string,
  conversationHistory: Message[],
): Promise<ReadableStream<Uint8Array>> {
  return generateStreamingFromNative(userInput, conversationHistory)
}
