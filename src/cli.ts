#!/usr/bin/env node
import { program } from "commander";
import { z } from "zod";
import { scrapeUrls } from "./scraper";
import { classifyFromSignals } from "./classifier";
import { generateAnalysis } from "./analysis";

const inputSchema = z.object({
  asset: z.string().min(1),
  issuer: z.string().min(1),
  mode: z.enum(["sharp", "descriptive"]).default("sharp"),
  urls: z.array(z.string().url()).min(1),
});

program
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
        urls: String(opts.urls || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      });
      const { facts, signals } = await scrapeUrls(parsed.urls);
      const classification = classifyFromSignals(signals);
      const analysis = generateAnalysis({
        mode: parsed.mode,
        assetName: parsed.asset,
        issuer: parsed.issuer,
        classification,
        facts,
      });
      // Output text only per spec
      console.log(analysis.overview);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parseAsync();

