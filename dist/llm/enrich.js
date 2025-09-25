"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichReportWithLLM = enrichReportWithLLM;
const perplexity_1 = require("./perplexity");
function buildPrompt(asset, skeletonMarkdown, pages) {
    const maxChars = 30000;
    const corpus = pages
        .map(p => `URL: ${p.url}\nTITLE: ${p.title}\nTEXT: ${p.text}`)
        .join('\n\n---\n\n')
        .slice(0, maxChars);
    const system = `You are an expert DeFi risk analyst. Use only the scraped content provided to fill in missing placeholders in the ${asset} risk assessment framework. Replace all {X}, {FVR}, and placeholder sections with real details from the content when available. Preserve the exact section and subsection headings and order. Do not invent facts; if a detail is not present in the scraped content, keep "Further verification required.". Output the full Markdown report only.`;
    const user = `Framework skeleton (Markdown):\n\n${skeletonMarkdown}\n\n==== SCRAPED CONTENT START ====\n${corpus}\n==== SCRAPED CONTENT END ====\n\nTask: Return the full Markdown with placeholders replaced using scraped facts. Keep mermaid blocks and tables intact where possible.`;
    return { system, user };
}
async function enrichReportWithLLM(asset, skeletonMarkdown, pages, options = {}) {
    const { system, user } = buildPrompt(asset, skeletonMarkdown, pages);
    const markdown = await (0, perplexity_1.generateWithPerplexity)(system, user, options);
    return markdown && markdown.trim().length > 0 ? markdown : skeletonMarkdown;
}
