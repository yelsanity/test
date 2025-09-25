import { request } from 'undici';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export type SupportedFile = 'pdf' | 'docx' | 'txt' | 'csv';

export interface DownloadedFileText {
  url: string;
  contentType?: string;
  fileType?: SupportedFile;
  text: string;
}

export async function fetchFile(url: string, timeoutMs = 30000): Promise<{ buffer: Buffer; contentType?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await request(url, { method: 'GET', signal: controller.signal });
    if (res.statusCode >= 400) throw new Error(`HTTP ${res.statusCode}`);
    const arr = await res.body.arrayBuffer();
    return { buffer: Buffer.from(arr), contentType: res.headers['content-type'] as string | undefined };
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractTextFromFile(url: string, buffer: Buffer, contentType?: string): Promise<DownloadedFileText> {
  const lowerUrl = url.toLowerCase();
  let fileType: SupportedFile | undefined;
  if (lowerUrl.endsWith('.pdf') || (contentType && contentType.includes('pdf'))) fileType = 'pdf';
  else if (lowerUrl.endsWith('.docx') || (contentType && contentType.includes('word'))) fileType = 'docx';
  else if (lowerUrl.endsWith('.csv') || (contentType && contentType.includes('csv'))) fileType = 'csv';
  else if (lowerUrl.endsWith('.txt') || (contentType && contentType.includes('text'))) fileType = 'txt';

  let text = '';
  try {
    if (fileType === 'pdf') {
      const data = await pdf(buffer);
      text = data.text || '';
    } else if (fileType === 'docx') {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value || '';
    } else if (fileType === 'csv' || fileType === 'txt') {
      text = buffer.toString('utf8');
    }
  } catch {
    text = '';
  }

  // Limit size
  text = text.replace(/\s+/g, ' ').trim().slice(0, 200000);
  return { url, contentType, fileType, text };
}

