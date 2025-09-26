import { load as loadHtml } from "cheerio";
import { request } from "undici";
import pdfParse from "pdf-parse";
import { ReserveSignals, ScrapedFact } from "./types";

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await request(url);
  const arrayBuffer = await res.body.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function fetchText(url: string): Promise<{ text: string; contentType: string | null }>{
  const res = await request(url);
  const contentType = res.headers["content-type"] as string | null;
  const bodyText = await res.body.text();
  return { text: bodyText, contentType };
}

async function extractTextFromUrl(url: string): Promise<string> {
  const lower = url.toLowerCase();
  try {
    if (lower.endsWith(".pdf")) {
      const buf = await fetchBuffer(url);
      const pdf = await pdfParse(buf);
      return normalizeWhitespace(pdf.text);
    }
    const { text, contentType } = await fetchText(url);
    if ((contentType && contentType.includes("text/html")) || /<html/i.test(text)) {
      const $ = loadHtml(text);
      const extracted = normalizeWhitespace($("body").text());
      return extracted;
    }
    return normalizeWhitespace(text);
  } catch (err) {
    return `ERROR fetching ${url}: ${(err as Error).message}`;
  }
}

function detectSignals(text: string): ReserveSignals {
  const hay = text.toLowerCase();
  const custodianMatches = Array.from(hay.matchAll(/state street|bny mellon|coinbase custody|fireblocks|anchorage/g)).map(m => m[0]);
  const managerMatches = Array.from(hay.matchAll(/vaneck|blackrock|fidelity|wisdomtree/g)).map(m => m[0]);
  return {
    mentionsCash: /\bcash\b|bank deposits?/.test(hay),
    mentionsTBills: /treasury|t-bill|t bills|t\.?\s*bills?/.test(hay),
    mentionsRepo: /repo|repurchase|reverse repurchase/.test(hay),
    mentionsMMF: /money market (fund|funds)/.test(hay),
    mentionsPoR: /proof of reserves|por feed|attestation|real-time reserves/.test(hay),
    mentionsCustodian: custodianMatches.length > 0,
    mentionsManager: managerMatches.length > 0,
    custodianNames: [...new Set(custodianMatches)],
    managerNames: [...new Set(managerMatches)],
  };
}

export async function scrapeUrls(urls: string[]): Promise<{ facts: ScrapedFact[]; signals: ReserveSignals }>{
  const texts = await Promise.all(urls.map(async (url) => ({ url, text: await extractTextFromUrl(url) })));
  const facts: ScrapedFact[] = texts.map(({ url, text }) => ({ sourceUrl: url, text }));
  // Merge signals over all pages
  const merged: ReserveSignals = {
    mentionsCash: false,
    mentionsTBills: false,
    mentionsRepo: false,
    mentionsMMF: false,
    mentionsPoR: false,
    mentionsCustodian: false,
    mentionsManager: false,
    custodianNames: [],
    managerNames: [],
  };
  for (const t of texts) {
    const s = detectSignals(t.text);
    merged.mentionsCash ||= s.mentionsCash;
    merged.mentionsTBills ||= s.mentionsTBills;
    merged.mentionsRepo ||= s.mentionsRepo;
    merged.mentionsMMF ||= s.mentionsMMF;
    merged.mentionsPoR ||= s.mentionsPoR;
    merged.mentionsCustodian ||= s.mentionsCustodian;
    merged.mentionsManager ||= s.mentionsManager;
    merged.custodianNames = Array.from(new Set([...merged.custodianNames, ...s.custodianNames]));
    merged.managerNames = Array.from(new Set([...merged.managerNames, ...s.managerNames]));
  }
  return { facts, signals: merged };
}

