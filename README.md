## Stablecoin Analysis Framework (Section 1)

This project generates Section 1 (Stablecoin Fundamentals) of a stablecoin analysis using Perplexity LLM and your provided references (URLs and/or local files, including PDFs).

### Setup

1. Copy `.env.example` to `.env` and set `PERPLEXITY_API_KEY`.
2. Install deps and build:

```bash
npm install
npm run build
```

### Dev Mode

```bash
npm run dev -- section1 -a "USDC" -i "Circle" -r https://www.circle.com/en/usdc https://centre.io/usdc.pdf
```

### Run Built CLI

```bash
npm start -- section1 -a "USDC" -i "Circle" -r <url_or_path> <url_or_path>
```

Options:
- `-a, --asset` Asset name
- `-i, --issuer` Issuer name
- `-r, --ref` One or more references (repeat or space-separated)
- `-t, --tone` `sharp` or `descriptive` (default)

### Output

CLI prints two sections:
- Narrative (short overview and risks for this section)
- Analysis (1.1.1 Classification with short analytical overview)

