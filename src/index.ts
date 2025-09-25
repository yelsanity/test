#!/usr/bin/env node
import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { FrameworkInputSchema } from './schema';
import { generateReport } from './generator';
import { scrapeAgoraCompanyPage } from './scraper/agora';
import { generateWithPerplexity } from './llm/perplexity';
import { crawlDomain, extractHintsFromCrawl } from './crawler/simpleCrawler';
import { enrichReportWithLLM } from './llm/enrich';

async function main() {
  const program = new Command();
  program
    .name('risk-report')
    .description('Generate stablecoin risk assessment report from JSON input')
    .requiredOption('-i, --input <path>', 'Path to input JSON')
    .requiredOption('-o, --output <path>', 'Output Markdown file')
    .option('-a, --asset <name>', 'Asset name override')
    .option('--scrape-agora', 'Scrape Agora company page for management data', false)
    .option('--use-llm', 'Use Perplexity LLM to enhance analysis text', false)
    .option('--llm-model <name>', 'Perplexity model name (or "auto")', 'auto')
    .option('--crawl-agora', 'Crawl agora.finance for references and terms', false)
    .option('--crawl-depth <n>', 'Crawler max depth', (v) => parseInt(v, 10), 2)
    .option('--crawl-max-pages <n>', 'Crawler max pages', (v) => parseInt(v, 10), 25);

  program.parse(process.argv);
  const opts = program.opts();

  const raw = await readFile(opts.input, 'utf8');
  const json = JSON.parse(raw);

  // Optionally scrape and enrich management table
  if (opts.scrapeAgora) {
    try {
      console.log('Scraping Agora company page...');
      const people = await scrapeAgoraCompanyPage();
      json.ecosystemGovernance = json.ecosystemGovernance || {};
      const existing = Array.isArray(json.ecosystemGovernance.managementTable)
        ? json.ecosystemGovernance.managementTable
        : [];
      json.ecosystemGovernance.managementTable = [...existing, ...people];
      console.log(`Scraped management entries: ${people.length}`);
    } catch {
      // ignore scraping errors; keep input as-is
    }
  }

  if (opts.crawlAgora) {
    try {
      console.log(`Crawling https://www.agora.finance depth=${opts.crawlDepth} maxPages=${opts.crawlMaxPages} ...`);
      const pages = await crawlDomain('https://www.agora.finance', { maxDepth: opts.crawlDepth, maxPages: opts.crawlMaxPages, sameHostOnly: true });
      console.log(`Crawled pages: ${pages.length}`);
      for (const p of pages) {
        const words = (p.markdown || p.text || '').split(/\s+/).filter(Boolean).length;
        console.log(` - ${p.url} (${words} words)`);
      }
      const hints = extractHintsFromCrawl(pages);
      json.__sources = pages.map((p: any) => p.url);
      json.regulationCompliance = json.regulationCompliance || {};
      if (hints.termsUrl) json.regulationCompliance.termsAndUseFileName = hints.termsUrl;
      if (!json.developmentSecurity) json.developmentSecurity = {};
      if (!json.developmentSecurity.developerDocs && hints.potentialDocs?.length) {
        json.developmentSecurity.developerDocs = hints.potentialDocs[0];
      }
      // Attach pages for later LLM enrichment
      (json as any).__crawlPages = pages;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Crawl skipped:', (e as Error)?.message);
    }
  }

  const parsed = FrameworkInputSchema.parse(json);

  // Generate skeleton first
  const skeleton = generateReport(parsed, opts.asset);

  // If LLM flag is enabled, enrich using crawl+scrape content
  let md = skeleton;
  if (opts.useLlm) {
    try {
      const pages = ((json as any).__crawlPages) || [];
      if (pages.length) {
        console.log(`Passing scraped content to LLM for enrichment (model=${opts.llmModel}, candidates via PERPLEXITY_MODELS or defaults)...`);
        md = await enrichReportWithLLM(opts.asset || parsed.assetName, skeleton, pages, { model: opts.llmModel, temperature: 0.2, maxTokens: 6000 });
      } else {
        console.log('No crawled pages available; using basic LLM improvement prompt.');
        const systemPrompt = 'You are an expert DeFi risk analyst. Improve clarity and fill placeholders only when confident; preserve structure and do not fabricate.';
        const userPrompt = `Markdown:\n${skeleton}`;
        md = await generateWithPerplexity(systemPrompt, userPrompt, { model: opts.llmModel, temperature: 0.2, maxTokens: 6000 });
      }
    } catch (e) {
      console.warn('LLM enrichment failed:', (e as Error)?.message);
      md = skeleton;
    }
  }

  console.log('Writing report...');
  await writeFile(opts.output, md, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Report written to ${opts.output}`);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Error:', err?.message || err);
  process.exit(1);
});

