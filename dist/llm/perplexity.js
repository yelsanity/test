"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWithPerplexity = generateWithPerplexity;
const undici_1 = require("undici");
const models_1 = require("./models");
async function generateWithPerplexity(systemPrompt, userPrompt, options = {}) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey)
        throw new Error('PERPLEXITY_API_KEY not set');
    const needsBrowsing = /https?:\/\//i.test(userPrompt);
    const model = (0, models_1.selectPerplexityModel)(options.model || 'auto', needsBrowsing);
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
            // Fallback: if invalid_model, try switching based on browsing need
            if (/invalid_model/i.test(txt)) {
                const alt = needsBrowsing ? 'sonar-large-online' : 'sonar-large-chat';
                if (alt !== model) {
                    const retry = await (0, undici_1.request)('https://api.perplexity.ai/chat/completions', {
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
                        const json2 = await retry.body.json();
                        const content2 = json2?.choices?.[0]?.message?.content;
                        return content2 ?? '';
                    }
                }
            }
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
