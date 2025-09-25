import { request } from 'undici';
import { selectPerplexityModel, selectModelCandidates } from './models';

export interface PerplexityOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  retries?: number;
}

export async function generateWithPerplexity(
  systemPrompt: string,
  userPrompt: string,
  options: PerplexityOptions = {}
): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not set');

  const needsBrowsing = /https?:\/\//i.test(userPrompt);
  const candidates = selectModelCandidates(options.model || 'auto', needsBrowsing);
  const temperature = options.temperature ?? 0.2;
  const maxTokens = options.maxTokens ?? 1200;

  const maxRetries = Math.max(0, options.retries ?? 2);
  let attempt = 0;
  let lastErr: any;
  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 90000);
    try {
      // Try candidates sequentially
      for (let i = 0; i < candidates.length; i++) {
        const model = candidates[i];
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
        if (res.statusCode < 400) {
          const json: any = await res.body.json();
          const content: string | undefined = json?.choices?.[0]?.message?.content;
          clearTimeout(timeout);
          return content ?? '';
        }
        const txt = await res.body.text();
        // Only throw on last candidate; otherwise try next model
        if (i === candidates.length - 1) {
          lastErr = new Error(`Perplexity HTTP ${res.statusCode}: ${txt}`);
        }
      }
    } catch (e: any) {
      lastErr = e;
      // fallthrough to retry
    } finally {
      clearTimeout(timeout);
    }
    attempt += 1;
    if (attempt > maxRetries) break;
    // Exponential backoff
    const backoff = 500 * Math.pow(2, attempt - 1);
    await new Promise(r => setTimeout(r, backoff));
  }
  throw (lastErr || new Error('Perplexity request failed'));
}

