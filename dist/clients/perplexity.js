import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const DEFAULT_MODEL = 'sonar-small-chat';
export async function generateWithPerplexity(options) {
    const { system, prompt, temperature = 0.3, model = DEFAULT_MODEL, maxTokens = 1200 } = options;
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
        throw new Error('Missing PERPLEXITY_API_KEY in environment');
    }
    const url = 'https://api.perplexity.ai/chat/completions';
    const messages = [];
    if (system && system.trim().length > 0) {
        messages.push({ role: 'system', content: system });
    }
    messages.push({ role: 'user', content: prompt });
    const payload = {
        model,
        temperature,
        max_tokens: maxTokens,
        messages,
    };
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
