"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlDomain = crawlDomain;
exports.extractHintsFromCrawl = extractHintsFromCrawl;
const undici_1 = require("undici");
const cheerio_1 = require("cheerio");
function normalizeUrl(base, href) {
    try {
        const u = new URL(href, base);
        if (!['http:', 'https:'].includes(u.protocol))
            return null;
        // Strip fragments
        u.hash = '';
        return u.toString();
    }
    catch {
        return null;
    }
}
async function crawlDomain(startUrl, opts = {}) {
    const maxDepth = opts.maxDepth ?? 2;
    const maxPages = opts.maxPages ?? 25;
    const sameHostOnly = opts.sameHostOnly ?? true;
    const userAgent = opts.userAgent ?? 'risk-report-crawler/0.1 (+https://example.com)';
    const start = new URL(startUrl);
    const queue = [{ url: start.toString(), depth: 0 }];
    const visited = new Set();
    const pages = [];
    while (queue.length && pages.length < maxPages) {
        const { url, depth } = queue.shift();
        if (visited.has(url))
            continue;
        visited.add(url);
        try {
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
            const res = await (0, undici_1.request)(url, {
                method: 'GET',
                headers: { 'user-agent': userAgent, accept: 'text/html' },
                signal: controller.signal,
            });
            clearTimeout(t);
            if (res.statusCode >= 400)
                continue;
            const html = await res.body.text();
            const $ = (0, cheerio_1.load)(html);
            const title = ($('title').first().text() || '').trim();
            const metaDescription = ($('meta[name="description"]').attr('content') || '').trim();
            // Remove non-content nodes for clean selection
            $('script, style, noscript').remove();
            // Extract structured content
            const headings = [];
            $('h1, h2, h3, h4').each((_, el) => {
                const t = $(el).text().replace(/\s+/g, ' ').trim();
                if (t)
                    headings.push(t);
            });
            const paragraphs = [];
            $('p').each((_, el) => {
                const t = $(el).text().replace(/\s+/g, ' ').trim();
                if (t)
                    paragraphs.push(t);
            });
            const listItems = [];
            $('li').each((_, el) => {
                const t = $(el).text().replace(/\s+/g, ' ').trim();
                if (t)
                    listItems.push(t);
            });
            const structuredMarkdownParts = [];
            if (title)
                structuredMarkdownParts.push(`# ${title}`);
            if (metaDescription)
                structuredMarkdownParts.push(`> ${metaDescription}`);
            if (headings.length)
                structuredMarkdownParts.push(headings.map(h => `## ${h}`).join('\n'));
            if (paragraphs.length)
                structuredMarkdownParts.push(paragraphs.join('\n\n'));
            if (listItems.length)
                structuredMarkdownParts.push(listItems.map(li => `- ${li}`).join('\n'));
            const markdown = structuredMarkdownParts.join('\n\n');
            // legacy page text (still useful as a quick corpus)
            const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 50000);
            const base = new URL(url);
            const outLinks = [];
            $('a[href]').each((_, el) => {
                const href = $(el).attr('href') || '';
                const abs = normalizeUrl(base, href);
                if (!abs)
                    return;
                const u = new URL(abs);
                if (sameHostOnly && u.host !== start.host)
                    return;
                outLinks.push(u.toString());
                if (depth + 1 <= maxDepth && !visited.has(u.toString())) {
                    queue.push({ url: u.toString(), depth: depth + 1 });
                }
            });
            pages.push({ url, title, text, metaDescription, headings, paragraphs, listItems, markdown, links: outLinks });
        }
        catch {
            // ignore fetch errors
        }
    }
    return pages;
}
function extractHintsFromCrawl(pages) {
    const lower = (s) => s.toLowerCase();
    let termsUrl;
    let privacyUrl;
    let companyUrl;
    const potentialDocs = new Set();
    for (const p of pages) {
        const u = lower(p.url);
        const t = lower(p.title);
        if (!termsUrl && (u.includes('terms') || t.includes('terms')))
            termsUrl = p.url;
        if (!privacyUrl && (u.includes('privacy') || t.includes('privacy')))
            privacyUrl = p.url;
        if (!companyUrl && (u.includes('company') || t.includes('company') || t.includes('about')))
            companyUrl = p.url;
        if (u.includes('docs') || u.includes('developer'))
            potentialDocs.add(p.url);
    }
    return { termsUrl, privacyUrl, companyUrl, potentialDocs: Array.from(potentialDocs) };
}
