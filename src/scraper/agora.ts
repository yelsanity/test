import { load } from 'cheerio';
import { request } from 'undici';
import { ManagementPerson } from '../schema';

export async function scrapeAgoraCompanyPage(url = 'https://www.agora.finance/company'): Promise<ManagementPerson[]> {
  try {
    const res = await request(url);
    if (res.statusCode >= 400) throw new Error(`HTTP ${res.statusCode}`);
    const html = await res.body.text();
    const $ = load(html);

    const people: ManagementPerson[] = [];

    // Heuristic selectors; site structure may change. We keep it resilient.
    $('[class*="team"], section:contains("Team"), section:contains("Leadership")').find('article, div, li').each((_, el) => {
      const name = $(el).find('h3, h4, [class*="name"]').first().text().trim();
      const role = $(el).find('p, [class*="role"], small').first().text().trim();
      if (name) {
        people.push({ founder: name, role });
      }
    });

    // Fallback: look for common card patterns
    if (people.length === 0) {
      $('[class*="card"]').each((_, el) => {
        const name = $(el).find('h3, h4').first().text().trim();
        const role = $(el).find('p').first().text().trim();
        if (name) people.push({ founder: name, role });
      });
    }

    return people;
  } catch (err) {
    return [];
  }
}

