import { request } from 'undici';

export interface PerplexityOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export async function generateWithPerplexity(
  systemPrompt: string,
  userPrompt: string,
  options: PerplexityOptions = {}
): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not set');

  const model = options.model || 'llama-3.1-sonar-large-128k-online';
  const temperature = options.temperature ?? 0.2;
  const maxTokens = options.maxTokens ?? 1200;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 60000);
  try {
    const res = await request('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
      signal: controller.signal,
    });
    if (res.statusCode >= 400) {
      const txt = await res.body.text();
      throw new Error(`Perplexity HTTP ${res.statusCode}: ${txt}`);
    }
    const json: any = await res.body.json();
    const content: string | undefined = json?.choices?.[0]?.message?.content;
    return content ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

