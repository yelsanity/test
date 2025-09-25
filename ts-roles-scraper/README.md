## TypeScript Roles Scraper (ethers.js)

Maps AccessControl role hashes to names, fetches current holders, and prints JSON or console output.

### Setup
```bash
cd ts-roles-scraper
npm i
```

### Usage
```bash
npx ts-node src/index.ts roles \
  --contract 0x00000000efe302beaa2b3e6e1b18d08d69a9012a \
  --rpc https://eth.llamarpc.com \
  --json
```

- By default it probes common role IDs (DEFAULT_ADMIN_ROLE, MINTER_ROLE, etc.).
- If the contract implements AccessControlEnumerable, holders are read directly.
- Otherwise it reconstructs holders from RoleGranted/RoleRevoked logs.

Override roles to probe:
```bash
npx ts-node src/index.ts roles \
  --contract 0x... \
  --roles 0x0000...,0x9f2df0fe...
```

Console output example:
```
Contract: 0x...
- DEFAULT_ADMIN_ROLE (0x00..00), admin: 0x00..00
  • 0xAdmin1
  • 0xAdmin2
- MINTER_ROLE (0x9f2d...)
  • (no holders found)
```

