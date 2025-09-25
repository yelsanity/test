## Etherscan Token Address Link Scraper

This tool collects addresses linked to an ERC-20 token on Ethereum using the official Etherscan API.

### What it does
- Fetches token transfer events (`tokentx`) for a contract
- Optionally fetches token holders
- Aggregates unique addresses (senders, recipients, deployer if resolvable)
- Outputs JSON and/or CSV

### Requirements
- Python 3.9+
- Etherscan API key

### Setup
1. Create a virtual environment (optional):
```bash
python3 -m venv .venv && source .venv/bin/activate
```
2. Install dependencies:
```bash
pip install -r requirements.txt
```
3. Set your Etherscan API key as an environment variable:
```bash
export ETHERSCAN_API_KEY=YourApiKeyToken
```

### Usage
```bash
python -m etherscan_scraper scrape \
  --contract 0x00000000efe302beaa2b3e6e1b18d08d69a9012a \
  --network mainnet \
  --include-holders \
  --start-block 0 --end-block 99999999 \
  --out-json out.json --out-csv out.csv
```

Flags:
- `--network`: `mainnet`, `goerli`, `sepolia`, `polygon`, etc. (auto-selects API host)
- `--include-holders`: also pulls current holders via API if available
- `--start-block`/`--end-block`: limit block range for transfers
- `--rate-limit`: max req/sec (default: 4)
- `--max-pages`: safety cap on pagination (default: 1000)

### Notes
- Respect Etherscan rate limits.
- Free keys may be rate limited; adjust `--rate-limit`.

### Roles introspection (low API usage)
Identify AccessControl roles with a handful of calls via `eth_call` proxy:
```bash
python -m etherscan_scraper roles \
  --contract 0x00000000efe302beaa2b3e6e1b18d08d69a9012a \
  --network mainnet \
  --out-json roles.json
```
Optionally check specific addresses for role membership:
```bash
python -m etherscan_scraper roles \
  --contract 0x... \
  --probe-admin 0xYourAddr1 --probe-admin 0xYourAddr2
```
This reads role constants and admin roles; it does not enumerate all members (which requires event logs). It is designed to minimize API calls.

