#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const promises_1 = require("fs/promises");
const schema_1 = require("./schema");
const generator_1 = require("./generator");
const agora_1 = require("./scraper/agora");
const perplexity_1 = require("./llm/perplexity");
const simpleCrawler_1 = require("./crawler/simpleCrawler");
async function main() {
    const program = new commander_1.Command();
    program
        .name('risk-report')
        .description('Generate stablecoin risk assessment report from JSON input')
        .requiredOption('-i, --input <path>', 'Path to input JSON')
        .requiredOption('-o, --output <path>', 'Output Markdown file')
        .option('-a, --asset <name>', 'Asset name override')
        .option('--scrape-agora', 'Scrape Agora company page for management data', false)
        .option('--use-llm', 'Use Perplexity LLM to enhance analysis text', false)
        .option('--llm-model <name>', 'Perplexity model name', 'llama-3.1-sonar-large-128k-online')
        .option('--crawl-agora', 'Crawl agora.finance for references and terms', false)
        .option('--crawl-depth <n>', 'Crawler max depth', (v) => parseInt(v, 10), 2)
        .option('--crawl-max-pages <n>', 'Crawler max pages', (v) => parseInt(v, 10), 25);
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
    if (opts.crawlAgora) {
        try {
            const pages = await (0, simpleCrawler_1.crawlDomain)('https://www.agora.finance', { maxDepth: opts.crawlDepth, maxPages: opts.crawlMaxPages, sameHostOnly: true });
            const hints = (0, simpleCrawler_1.extractHintsFromCrawl)(pages);
            json.__sources = pages.map((p) => p.url);
            json.regulationCompliance = json.regulationCompliance || {};
            if (hints.termsUrl)
                json.regulationCompliance.termsAndUseFileName = hints.termsUrl;
            if (!json.developmentSecurity)
                json.developmentSecurity = {};
            if (!json.developmentSecurity.developerDocs && hints.potentialDocs?.length) {
                json.developmentSecurity.developerDocs = hints.potentialDocs[0];
            }
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Crawl skipped:', e?.message);
        }
    }
    const parsed = schema_1.FrameworkInputSchema.parse(json);
    if (opts.useLlm) {
        // Compose a compact prompt with key facts to improve analysis language.
        const systemPrompt = 'You are an expert DeFi risk analyst. Improve clarity, risk-first framing, and comparative context without adding fabricated details. Keep the framework structure intact and preserve placeholders like "Further verification required."';
        const userPrompt = `Asset: ${opts.asset || parsed.assetName}\nKey facts (JSON): ${JSON.stringify(parsed, null, 2)}\nTask: Provide refined narrative snippets for sections 1.1.1 (classification narrative only), 3.1.1 (executive summary narrative only), and 5.7 (analyst conclusion only). Return a JSON with keys {"s1_1_1","s3_1_1","s5_7"}.`;
        try {
            const llm = await (0, perplexity_1.generateWithPerplexity)(systemPrompt, userPrompt, { model: opts.llmModel, temperature: 0.2, maxTokens: 1200 });
            // Best-effort parse; ignore on failure
            try {
                const parsedLlm = JSON.parse(llm);
                parsed.__llm = parsedLlm;
            }
            catch { }
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.warn('LLM enhancement skipped:', e?.message);
        }
    }
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
