#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const promises_1 = require("fs/promises");
const schema_1 = require("./schema");
const generator_1 = require("./generator");
const agora_1 = require("./scraper/agora");
async function main() {
    const program = new commander_1.Command();
    program
        .name('risk-report')
        .description('Generate stablecoin risk assessment report from JSON input')
        .requiredOption('-i, --input <path>', 'Path to input JSON')
        .requiredOption('-o, --output <path>', 'Output Markdown file')
        .option('-a, --asset <name>', 'Asset name override')
        .option('--scrape-agora', 'Scrape Agora company page for management data', false);
    program.parse(process.argv);
    const opts = program.opts();
    const raw = await (0, promises_1.readFile)(opts.input, 'utf8');
    const json = JSON.parse(raw);
    // Optionally scrape and enrich management table
    if (opts.scrapeAgora) {
        try {
            const people = await (0, agora_1.scrapeAgoraCompanyPage)();
            json.ecosystemGovernance = json.ecosystemGovernance || {};
            const existing = Array.isArray(json.ecosystemGovernance.managementTable)
                ? json.ecosystemGovernance.managementTable
                : [];
            json.ecosystemGovernance.managementTable = [...existing, ...people];
        }
        catch {
            // ignore scraping errors; keep input as-is
        }
    }
    const parsed = schema_1.FrameworkInputSchema.parse(json);
    const md = (0, generator_1.generateReport)(parsed, opts.asset);
    await (0, promises_1.writeFile)(opts.output, md, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`Report written to ${opts.output}`);
}
main().catch(err => {
    // eslint-disable-next-line no-console
    console.error('Error:', err?.message || err);
    process.exit(1);
});
