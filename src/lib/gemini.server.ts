import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function getGoogleProvider(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY");
  }
  return createGoogleGenerativeAI({
    apiKey: key,
  });
}
