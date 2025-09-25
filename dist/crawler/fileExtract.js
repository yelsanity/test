"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFile = fetchFile;
exports.extractTextFromFile = extractTextFromFile;
const undici_1 = require("undici");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
async function fetchFile(url, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await (0, undici_1.request)(url, { method: 'GET', signal: controller.signal });
        if (res.statusCode >= 400)
            throw new Error(`HTTP ${res.statusCode}`);
        const arr = await res.body.arrayBuffer();
        return { buffer: Buffer.from(arr), contentType: res.headers['content-type'] };
    }
    finally {
        clearTimeout(timeout);
    }
}
async function extractTextFromFile(url, buffer, contentType) {
    const lowerUrl = url.toLowerCase();
    let fileType;
    if (lowerUrl.endsWith('.pdf') || (contentType && contentType.includes('pdf')))
        fileType = 'pdf';
    else if (lowerUrl.endsWith('.docx') || (contentType && contentType.includes('word')))
        fileType = 'docx';
    else if (lowerUrl.endsWith('.csv') || (contentType && contentType.includes('csv')))
        fileType = 'csv';
    else if (lowerUrl.endsWith('.txt') || (contentType && contentType.includes('text')))
        fileType = 'txt';
    let text = '';
    try {
        if (fileType === 'pdf') {
            const data = await (0, pdf_parse_1.default)(buffer);
            text = data.text || '';
        }
        else if (fileType === 'docx') {
            const { value } = await mammoth_1.default.extractRawText({ buffer });
            text = value || '';
        }
        else if (fileType === 'csv' || fileType === 'txt') {
            text = buffer.toString('utf8');
        }
    }
    catch {
        text = '';
    }
    // Limit size
    text = text.replace(/\s+/g, ' ').trim().slice(0, 200000);
    return { url, contentType, fileType, text };
}
