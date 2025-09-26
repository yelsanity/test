import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export type PerplexityModel =
  | 'sonar-small-online'
  | 'sonar-medium-online'
  | 'sonar-large-online'
  | 'sonar-small-chat'
  | 'sonar-medium-chat'
  | 'sonar-large-chat'
  | 'sonar-reasoning-pro';

export interface GenerateOptions {
  system?: string;
  prompt: string;
  temperature?: number;
  model?: PerplexityModel;
  maxTokens?: number;
}

const DEFAULT_MODEL: PerplexityModel = 'sonar-small-chat';

export async function generateWithPerplexity(options: GenerateOptions): Promise<string> {
  const { system, prompt, temperature = 0.3, model = DEFAULT_MODEL, maxTokens = 1200 } = options;

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('Missing PERPLEXITY_API_KEY in environment');
  }

  const url = 'https://api.perplexity.ai/chat/completions';

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (system && system.trim().length > 0) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: prompt });

  const payload = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages,
  } as const;

  const response = await axios.post(url, payload, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 60_000,
  });

  const text = response?.data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Empty response from Perplexity');
  }
  return text.trim();
}

