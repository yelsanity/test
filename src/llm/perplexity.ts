import { request } from 'undici';
import { selectPerplexityModel } from './models';

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

  const needsBrowsing = /https?:\/\//i.test(userPrompt);
  const model = selectPerplexityModel(options.model || 'auto', needsBrowsing);
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
      // Fallback: if invalid_model, try switching based on browsing need
      if (/invalid_model/i.test(txt)) {
        const alt = needsBrowsing ? 'sonar-large-online' : 'sonar-large-chat';
        if (alt !== model) {
          const retry = await request('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: alt,
              temperature,
              max_tokens: maxTokens,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
            }),
            signal: controller.signal,
          });
          if (retry.statusCode < 400) {
            const json2: any = await retry.body.json();
            const content2: string | undefined = json2?.choices?.[0]?.message?.content;
            return content2 ?? '';
          }
        }
      }
      throw new Error(`Perplexity HTTP ${res.statusCode}: ${txt}`);
    }
    const json: any = await res.body.json();
    const content: string | undefined = json?.choices?.[0]?.message?.content;
    return content ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

