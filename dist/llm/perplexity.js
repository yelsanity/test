"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWithPerplexity = generateWithPerplexity;
const undici_1 = require("undici");
async function generateWithPerplexity(systemPrompt, userPrompt, options = {}) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey)
        throw new Error('PERPLEXITY_API_KEY not set');
    const model = options.model || 'llama-3.1-sonar-large-128k-online';
    const temperature = options.temperature ?? 0.2;
    const maxTokens = options.maxTokens ?? 1200;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 60000);
    try {
        const res = await (0, undici_1.request)('https://api.perplexity.ai/chat/completions', {
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
        const json = await res.body.json();
        const content = json?.choices?.[0]?.message?.content;
        return content ?? '';
    }
    finally {
        clearTimeout(timeout);
    }
}
