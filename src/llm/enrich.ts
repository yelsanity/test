import { CrawledPage } from '../crawler/simpleCrawler';
import { generateWithPerplexity, PerplexityOptions } from './perplexity';

function buildPrompt(asset: string, skeletonMarkdown: string, pages: CrawledPage[]): { system: string; user: string } {
  const maxChars = 30000;
  const corpus = pages
    .map(p => {
      const header = `URL: ${p.url}\nTITLE: ${p.title}\nMETA: ${p.metaDescription || ''}`;
      const body = p.markdown || p.text;
      return `${header}\n\n${body}`;
    })
    .join('\n\n---\n\n')
    .slice(0, maxChars);

  const system = `You are an expert DeFi risk analyst. Use only the scraped content provided to fill in missing placeholders in the ${asset} risk assessment framework. Replace all {X}, {FVR}, and placeholder sections with real details from the content when available. Preserve the exact section and subsection headings and order. Do not invent facts; if a detail is not present in the scraped content, keep "Further verification required.". Output the full Markdown report only.`;

  const user = `Framework skeleton (Markdown):\n\n${skeletonMarkdown}\n\n==== SCRAPED CONTENT START ====\n${corpus}\n==== SCRAPED CONTENT END ====\n\nTask: Return the full Markdown with placeholders replaced using scraped facts. Keep mermaid blocks and tables intact where possible.`;

  return { system, user };
}

export async function enrichReportWithLLM(asset: string, skeletonMarkdown: string, pages: CrawledPage[], options: PerplexityOptions = {}): Promise<string> {
  const { system, user } = buildPrompt(asset, skeletonMarkdown, pages);
  try {
    const markdown = await generateWithPerplexity(system, user, { ...options, retries: options.retries ?? 2, timeoutMs: options.timeoutMs ?? 120000 });
    if (markdown && markdown.trim().length > 0) return markdown;
  } catch {
    // fall through to per-section enrichment
  }
  // Append downloaded file texts if present on caller
  // Note: we can't import runtime state here; corpus was included in buildPrompt from pages
  // Fallback: enrich key sections individually to reduce token load
  const sections = ['### 1.1.1 Stablecoin Classification', '#### 3.1.1 Smart Contract Structure', '### 5.7 Analyst Conclusion'];
  let result = skeletonMarkdown;
  for (const marker of sections) {
    const idx = result.indexOf(marker);
    if (idx === -1) continue;
    const nextIdx = result.indexOf('\n### ', idx + 1);
    const slice = nextIdx === -1 ? result.slice(idx) : result.slice(idx, nextIdx);
    const { system: sys2, user: usr2 } = buildPrompt(asset, slice, pages);
    try {
      const enriched = await generateWithPerplexity(sys2, usr2, { ...options, retries: 1, timeoutMs: (options.timeoutMs ?? 120000) });
      if (enriched && enriched.trim().length > 0) {
        result = result.replace(slice, enriched);
      }
    } catch {
      // keep original slice
    }
  }
  return result;
}

