"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeAgoraCompanyPage = scrapeAgoraCompanyPage;
const cheerio_1 = require("cheerio");
const undici_1 = require("undici");
async function scrapeAgoraCompanyPage(url = 'https://www.agora.finance/company') {
    try {
        const res = await (0, undici_1.request)(url);
        if (res.statusCode >= 400)
            throw new Error(`HTTP ${res.statusCode}`);
        const html = await res.body.text();
        const $ = (0, cheerio_1.load)(html);
        const people = [];
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
                if (name)
                    people.push({ founder: name, role });
            });
        }
        return people;
    }
    catch (err) {
        return [];
    }
}
