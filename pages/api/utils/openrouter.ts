import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://jjoist.com", // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "jjoist", // Optional. Site title for rankings on openrouter.ai.
    "Content-Type": "application/json",
  }
});

export const chat = async (prompt: string, model: string) => {
  return await generateText({
    model: openrouter(model),
    prompt
  })
}
