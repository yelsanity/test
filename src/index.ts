#!/usr/bin/env node
import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { FrameworkInputSchema } from './schema';
import { generateReport } from './generator';
import { scrapeAgoraCompanyPage } from './scraper/agora';

async function main() {
  const program = new Command();
  program
    .name('risk-report')
    .description('Generate stablecoin risk assessment report from JSON input')
    .requiredOption('-i, --input <path>', 'Path to input JSON')
    .requiredOption('-o, --output <path>', 'Output Markdown file')
    .option('-a, --asset <name>', 'Asset name override')
    .option('--scrape-agora', 'Scrape Agora company page for management data', false);

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

