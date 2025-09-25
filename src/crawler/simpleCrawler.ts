import { request } from 'undici';
import { load } from 'cheerio';

export interface CrawlOptions {
  maxDepth?: number;
  maxPages?: number;
  sameHostOnly?: boolean;
  userAgent?: string;
  timeoutMs?: number;
}

export interface CrawledPage {
  url: string;
  title: string;
  text: string;
  links: string[];
}

function normalizeUrl(base: URL, href: string): string | null {
  try {
    const u = new URL(href, base);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    // Strip fragments
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

export async function crawlDomain(startUrl: string, opts: CrawlOptions = {}): Promise<CrawledPage[]> {
  const maxDepth = opts.maxDepth ?? 2;
  const maxPages = opts.maxPages ?? 25;
  const sameHostOnly = opts.sameHostOnly ?? true;
  const userAgent = opts.userAgent ?? 'risk-report-crawler/0.1 (+https://example.com)';
  const start = new URL(startUrl);
  const queue: Array<{ url: string; depth: number }> = [{ url: start.toString(), depth: 0 }];
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];

  while (queue.length && pages.length < maxPages) {
    const { url, depth } = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
      const res = await request(url, {
        method: 'GET',
        headers: { 'user-agent': userAgent, accept: 'text/html' },
        signal: controller.signal,
      });
      clearTimeout(t);
      if (res.statusCode >= 400) continue;
      const html = await res.body.text();
      const $ = load(html);
      const title = ($('title').first().text() || '').trim();

      // Remove non-content nodes
      $('script, style, noscript').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 20000);

      const base = new URL(url);
      const outLinks: string[] = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const abs = normalizeUrl(base, href);
        if (!abs) return;
        const u = new URL(abs);
        if (sameHostOnly && u.host !== start.host) return;
        outLinks.push(u.toString());
        if (depth + 1 <= maxDepth && !visited.has(u.toString())) {
          queue.push({ url: u.toString(), depth: depth + 1 });
        }
      });

      pages.push({ url, title, text, links: outLinks });
    } catch {
      // ignore fetch errors
    }
  }
  return pages;
}

export function extractHintsFromCrawl(pages: CrawledPage[]): {
  termsUrl?: string;
  privacyUrl?: string;
  companyUrl?: string;
  potentialDocs: string[];
} {
  const lower = (s: string) => s.toLowerCase();
  let termsUrl: string | undefined;
  let privacyUrl: string | undefined;
  let companyUrl: string | undefined;
  const potentialDocs = new Set<string>();

  for (const p of pages) {
    const u = lower(p.url);
    const t = lower(p.title);
    if (!termsUrl && (u.includes('terms') || t.includes('terms'))) termsUrl = p.url;
    if (!privacyUrl && (u.includes('privacy') || t.includes('privacy'))) privacyUrl = p.url;
    if (!companyUrl && (u.includes('company') || t.includes('company') || t.includes('about'))) companyUrl = p.url;
    if (u.includes('docs') || u.includes('developer')) potentialDocs.add(p.url);
  }
  return { termsUrl, privacyUrl, companyUrl, potentialDocs: Array.from(potentialDocs) };
}

