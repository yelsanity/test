## Stablecoin Risk Report CLI (TypeScript)

Generate a comprehensive DeFi stablecoin risk assessment report (Markdown) from a structured JSON input, following the provided framework. Optionally enriches the Management & Operations table by scraping the Agora company page.

### Install

```bash
npm install
npm run build
```

### Usage

```bash
# From TypeScript directly
npm run dev -- --input sample/input.json --output report.md --asset AUSD --scrape-agora --crawl-agora --use-llm --llm-model auto

# From compiled JS
npm run build
npm run generate -- --input sample/input.json --output report.md --asset AUSD --scrape-agora --crawl-agora --use-llm --llm-model auto
```

Flags:
- `--input <path>`: JSON file with framework data
- `--output <path>`: Output Markdown file
- `--asset <name>`: Asset name placeholder (default: AUSD)
- `--scrape-agora`: Try to fetch Management data from https://www.agora.finance/company
- `--crawl-agora`: Crawl `https://www.agora.finance` (same-host) up to `--crawl-depth` and `--crawl-max-pages`; stores discovered URLs as sources and fills hints (e.g., Terms URL)
- `--use-llm`: Enhance specific narratives via Perplexity (requires PERPLEXITY_API_KEY)
- `--llm-model <name>`: Perplexity model to use (or `auto`). If `auto`, the app selects:
  - `llama-3.1-sonar-huge-128k-online` for browsing/retrieval tasks
  - `llama-3.1-sonar-large-128k-chat` for enrichment/classification
- Env: `PERPLEXITY_API_KEY` must be set to call Perplexity

If fields are missing, the generator will insert "Further verification required." and a source-priority disclaimer where relevant.

### Sample

See `sample/input.json` for a minimal starting point. Populate fields as available to reduce placeholders and verification flags.

