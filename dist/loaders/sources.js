import axios from 'axios';
import { load as loadCheerio } from 'cheerio';
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';
function isUrl(ref) {
    try {
        const u = new URL(ref);
        return u.protocol === 'http:' || u.protocol === 'https:';
    }
    catch {
        return false;
    }
}
async function loadHtmlFromUrl(url) {
    const resp = await axios.get(url, { responseType: 'text', timeout: 30_000 });
    const $ = loadCheerio(resp.data);
    $('script, style, noscript').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return { ref: url, content: text, type: 'html' };
}
async function loadPdfFromUrl(url) {
    const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 45_000 });
    const pdf = await pdfParse(Buffer.from(resp.data));
    return { ref: url, content: pdf.text, type: 'pdf' };
}
async function loadLocalFile(filePath) {
    const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    const buf = await fs.readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    if (ext === '.pdf') {
        const pdf = await pdfParse(buf);
        return { ref: abs, content: pdf.text, type: 'pdf' };
    }
    return { ref: abs, content: buf.toString('utf8'), type: 'text' };
}
export async function loadReferences(refs) {
    const tasks = refs.map(async (ref) => {
        if (isUrl(ref)) {
            const lower = ref.toLowerCase();
            if (lower.endsWith('.pdf'))
                return loadPdfFromUrl(ref);
            return loadHtmlFromUrl(ref);
        }
        return loadLocalFile(ref);
    });
    const results = await Promise.allSettled(tasks);
    return results.flatMap((r, idx) => {
        if (r.status === 'fulfilled')
            return [r.value];
        return [{ ref: refs[idx], content: `Failed to load: ${r.reason}`, type: 'unknown' }];
    });
}
