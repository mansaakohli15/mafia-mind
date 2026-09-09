/**
 * Google Gemini Server-Side Provider Module
 *
 * Configures the Google Generative AI provider using @ai-sdk/google.
 * Loads the API key securely from environment variables (GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY).
 *
 * Note: This module is executed strictly on the server side to protect API keys.
 */
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Initializes and returns an instance of the Google Generative AI SDK provider.
 *
 * @param apiKey - Optional explicit API key override
 * @returns Configured Google Generative AI provider instance
 * @throws Error if no valid Gemini API key is configured
 */
export function getGoogleProvider(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    throw new Error(
      "Missing GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY). Please configure it in your environment variables.",
    );
  }
  return createGoogleGenerativeAI({
    apiKey: key,
  });
}
