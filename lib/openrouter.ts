import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, GenerateTextResult, ModelMessage } from 'ai';

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is not set');
}

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://zeitflow.io", // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "ZeitFlow", // Optional. Site title for rankings on openrouter.ai.
    "Content-Type": "application/json",
  }
});

export const chat = async (prompt: string, model: string, options: { systemPrompt?: string, history?: ModelMessage[] } = {}): Promise<GenerateTextResult<never, never> | { text: string; error: boolean }> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let props = {} as any;
    if (options.systemPrompt) {
      const messages: ModelMessage[] = [
        {
          role: 'system',
          content: options.systemPrompt
        }
      ];
      if (options.history) {
        messages.push(...options.history);
      }
      messages.push({
        role: 'user',
        content: prompt
      });
      props = {
        messages
      }
    } else {
      props = {
        prompt
      }
    }

    return await generateText({
      model: openrouter(model),
      ...props
    })
  } catch (error) {
    console.error('OpenRouter API error:', error);
    // Return a structured error response instead of throwing
    return {
      text: 'Sorry, there was an error communicating with the AI service. Please check your API configuration and try again.',
      error: true
    };
  }
}

