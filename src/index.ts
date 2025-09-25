#!/usr/bin/env node
import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { FrameworkInputSchema } from './schema';
import { generateReport } from './generator';
import { scrapeAgoraCompanyPage } from './scraper/agora';
import { generateWithPerplexity } from './llm/perplexity';

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
    .option('--llm-model <name>', 'Perplexity model name', 'llama-3.1-sonar-large-128k-online');

  program.parse(process.argv);
  const opts = program.opts();

  const raw = await readFile(opts.input, 'utf8');
  const json = JSON.parse(raw);

  // Optionally scrape and enrich management table
  if (opts.scrapeAgora) {
    try {
      const people = await scrapeAgoraCompanyPage();
      json.ecosystemGovernance = json.ecosystemGovernance || {};
      const existing = Array.isArray(json.ecosystemGovernance.managementTable)
        ? json.ecosystemGovernance.managementTable
        : [];
      json.ecosystemGovernance.managementTable = [...existing, ...people];
    } catch {
      // ignore scraping errors; keep input as-is
    }
  }

  const parsed = FrameworkInputSchema.parse(json);

  if (opts.useLlm) {
    // Compose a compact prompt with key facts to improve analysis language.
    const systemPrompt = 'You are an expert DeFi risk analyst. Improve clarity, risk-first framing, and comparative context without adding fabricated details. Keep the framework structure intact and preserve placeholders like "Further verification required."';
    const userPrompt = `Asset: ${opts.asset || parsed.assetName}\nKey facts (JSON): ${JSON.stringify(parsed, null, 2)}\nTask: Provide refined narrative snippets for sections 1.1.1 (classification narrative only), 3.1.1 (executive summary narrative only), and 5.7 (analyst conclusion only). Return a JSON with keys {"s1_1_1","s3_1_1","s5_7"}.`;
    try {
      const llm = await generateWithPerplexity(systemPrompt, userPrompt, { model: opts.llmModel, temperature: 0.2, maxTokens: 1200 });
      // Best-effort parse; ignore on failure
      try {
        const parsedLlm = JSON.parse(llm);
        (parsed as any).__llm = parsedLlm;
      } catch {}
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('LLM enhancement skipped:', (e as Error)?.message);
    }
  }

  const md = generateReport(parsed, opts.asset);
  await writeFile(opts.output, md, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Report written to ${opts.output}`);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Error:', err?.message || err);
  process.exit(1);
});

