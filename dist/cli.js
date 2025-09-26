#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const zod_1 = require("zod");
const scraper_1 = require("./scraper");
const classifier_1 = require("./classifier");
const analysis_1 = require("./analysis");
const inputSchema = zod_1.z.object({
    asset: zod_1.z.string().min(1),
    issuer: zod_1.z.string().min(1),
    mode: zod_1.z.enum(["sharp", "descriptive"]).default("sharp"),
    urls: zod_1.z.array(zod_1.z.string().url()).min(1),
});
commander_1.program
    .name("stable-analyzer")
    .description("Scrape, classify, and analyze stablecoins")
    .option("-a, --asset <string>", "Asset name")
    .option("-i, --issuer <string>", "Issuer/company")
    .option("-m, --mode <sharp|descriptive>", "Analysis mode", "sharp")
    .option("-u, --urls <items>", "Comma-separated URLs")
    .action(async (opts) => {
    try {
        const parsed = inputSchema.parse({
            asset: opts.asset,
            issuer: opts.issuer,
            mode: opts.mode,
            urls: String(opts.urls || "").split(",").map((s) => s.trim()).filter(Boolean),
        });
        const { facts, signals } = await (0, scraper_1.scrapeUrls)(parsed.urls);
        const classification = (0, classifier_1.classifyFromSignals)(signals);
        const analysis = (0, analysis_1.generateAnalysis)({
            mode: parsed.mode,
            assetName: parsed.asset,
            issuer: parsed.issuer,
            classification,
            facts,
        });
        // Output text only per spec
        console.log(analysis.overview);
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
});
commander_1.program.parseAsync();
