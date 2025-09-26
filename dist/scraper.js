"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeUrls = scrapeUrls;
const cheerio_1 = require("cheerio");
const undici_1 = require("undici");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
function normalizeWhitespace(input) {
    return input.replace(/\s+/g, " ").trim();
}
async function fetchBuffer(url) {
    const res = await (0, undici_1.request)(url);
    const arrayBuffer = await res.body.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
async function fetchText(url) {
    const res = await (0, undici_1.request)(url);
    const contentType = res.headers["content-type"];
    const bodyText = await res.body.text();
    return { text: bodyText, contentType };
}
async function extractTextFromUrl(url) {
    const lower = url.toLowerCase();
    try {
        if (lower.endsWith(".pdf")) {
            const buf = await fetchBuffer(url);
            const pdf = await (0, pdf_parse_1.default)(buf);
            return normalizeWhitespace(pdf.text);
        }
        const { text, contentType } = await fetchText(url);
        if ((contentType && contentType.includes("text/html")) || /<html/i.test(text)) {
            const $ = (0, cheerio_1.load)(text);
            const extracted = normalizeWhitespace($("body").text());
            return extracted;
        }
        return normalizeWhitespace(text);
    }
    catch (err) {
        return `ERROR fetching ${url}: ${err.message}`;
    }
}
function detectSignals(text) {
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
async function scrapeUrls(urls) {
    const texts = await Promise.all(urls.map(async (url) => ({ url, text: await extractTextFromUrl(url) })));
    const facts = texts.map(({ url, text }) => ({ sourceUrl: url, text }));
    // Merge signals over all pages
    const merged = {
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
