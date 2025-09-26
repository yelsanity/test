# Stable Analyzer (TypeScript)

Analyze stablecoins by scraping provided URLs, classifying per taxonomy, and generating a sharp or descriptive overview.

## Install

```bash
npm install
npm run build
```

For dev mode:
```bash
npm run dev -- --asset "AUSD" --issuer "Agora Finance (Agora Financial Blue Ltd)" --mode sharp --urls "https://www.agora.finance/product/ausd,https://chaoslabs.xyz/posts/agora-integrates-proof-of-reserves,https://edgebychaos.com/por-feeds/agora,https://static.agora.finance/termsofuse.pdf,https://static.agora.finance/riskdisclosures.pdf"
```

## CLI

```bash
node dist/cli.js \
  --asset "AUSD" \
  --issuer "Agora Finance (Agora Financial Blue Ltd)" \
  --mode sharp \
  --urls "https://www.agora.finance/product/ausd,https://chaoslabs.xyz/posts/agora-integrates-proof-of-reserves,https://edgebychaos.com/por-feeds/agora,https://static.agora.finance/termsofuse.pdf,https://static.agora.finance/riskdisclosures.pdf"
```

- `--mode`: `sharp` or `descriptive`
- Output: 1–2 paragraph text to STDOUT

## Notes
- Scraper extracts text from HTML and PDFs, then detects signals (cash, T-bills, repo, PoR, custodian/manager names).
- Classifier heuristics prioritize off-chain fiat reserve indicators + custodian references.
- Analysis generator emits concise text; customize in `src/analysis.ts`.