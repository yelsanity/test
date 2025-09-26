declare module 'pdf-parse' {
  interface PDFInfo {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata?: unknown;
    version?: string;
    text: string;
  }
  function pdfParse(data: Buffer | Uint8Array | ArrayBuffer): Promise<PDFInfo>;
  export default pdfParse;
}

