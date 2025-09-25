import { CrawledPage } from '../crawler/simpleCrawler';
import { generateWithPerplexity, PerplexityOptions } from './perplexity';

function buildPrompt(asset: string, skeletonMarkdown: string, pages: CrawledPage[]): { system: string; user: string } {
  const maxChars = 45000;
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
  const markdown = await generateWithPerplexity(system, user, options);
  return markdown && markdown.trim().length > 0 ? markdown : skeletonMarkdown;
}

