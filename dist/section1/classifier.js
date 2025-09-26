import { generateWithPerplexity } from '../clients/perplexity.js';
import { dedent, sanitizeForPrompt } from '../utils/text.js';
function buildSectionIntro(tone = 'descriptive') {
    if (tone === 'sharp') {
        return 'We examine stablecoin fundamentals with a focus on reserve mechanisms, governance, and failure modes that could lead to peg instability, redemption bottlenecks, or regulatory intervention.';
    }
    return 'This section outlines the fundamentals of stablecoins, including collateral approaches, peg mechanisms, and governance. We also flag material risks that could impact stability or adoption.';
}
function buildSourceBundle(sources, maxChars = 20_000) {
    const joined = sources
        .map((s) => `SOURCE: ${s.ref}\nTYPE: ${s.type}\nCONTENT:\n${s.content}`)
        .join('\n\n---\n\n');
    const text = sanitizeForPrompt(joined);
    return text.length > maxChars ? text.slice(0, maxChars) : text;
}
function buildClassificationPrompt(input) {
    const { assetName, issuerName, sources, tone = 'descriptive' } = input;
    const intro = buildSectionIntro(tone);
    const sourceText = buildSourceBundle(sources);
    return dedent(`
    You are a professional crypto analyst. Follow the instructions strictly.

    Section: Stablecoin Fundamentals
    Asset: ${assetName}
    Issuer: ${issuerName}

    Narrative context:
    ${intro}

    Task 1: Short narrative (2-3 sentences) describing what this section covers and the risks to look for.

    Task 2: 1.1 Description of the Stablecoin — 1.1.1 Stablecoin Classification
    Instructions:
    - Step 1: Scrape and summarize details about the stablecoin's collateral or reserve assets from the provided sources.
    - Step 2: Map to the closest classification among: Fiat-Backed (Fully or Partially Collateralized), Commodity-Backed (Gold/Other), Crypto-Backed (Over-Collateralized/Hybrid/Partially), Algorithmic (Pure/Fractional/Rebasing), RWA-Backed (Treasury/Bank Deposit Tokenized), Hybrid Models (Collateral+Governance Token or Collateral+Yield-Bearing Assets).
    - Step 3: Produce a short analytical overview (1–2 paragraphs). The output must be plain text only.

    Analysis Requirements:
    - Reserve & Collateral Model: Describe reserve structure and collateral approach.
    - Regulatory & Institutional Implications: Briefly note how reserves impact regulatory alignment and adoption.
    - Strengths: Bullet-like sentences, plain language.
    - Risks: Bullet-like sentences with intensity markers (e.g., High custody risk, Moderate governance risk).
    - Tone: Concise, professional, analytical. Avoid hype.

    SOURCES (may include URLs or file extracts):
    ${sourceText}

    Output format:
    - Start with the short narrative.
    - Then write the classification and the 1–2 paragraph analysis. Do not use JSON and do not output a list; use cohesive prose with short bullet-like sentences embedded if needed. Keep it under ~450 words.
  `);
}
export async function runSection1Classification(input) {
    const prompt = buildClassificationPrompt(input);
    const system = 'Be accurate and cite only from provided sources; avoid speculation. Keep response in text paragraphs.';
    const analysis = await generateWithPerplexity({ system, prompt, temperature: 0.2, model: 'sonar-small-online', maxTokens: 900 });
    // Split first 2-3 sentences as narrative heuristically.
    const sentences = analysis.split(/(?<=[.!?])\s+/);
    const narrative = sentences.slice(0, Math.min(3, sentences.length)).join(' ');
    return { narrative, analysis };
}
