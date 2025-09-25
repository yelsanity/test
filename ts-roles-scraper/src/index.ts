import { ethers } from "ethers";
import { getRoles } from "./roles.js";
import { DEFAULT_ROLE_NAMES, RoleIdHex } from "./types.js";

function parseRoleIds(input?: string): RoleIdHex[] {
  if (!input) return Object.keys(DEFAULT_ROLE_NAMES) as RoleIdHex[];
  return input.split(",").map((x) => x.trim() as RoleIdHex);
}

async function main() {
  const [cmd] = process.argv.slice(2, 3);
  if (cmd !== "roles") {
    console.log("Usage: ts-node src/index.ts roles --contract <addr> [--rpc <url> | --etherscan-key <key>] [--roles <comma-separated-role-ids>] [--json]");
    process.exit(0);
  }

  const args = new Map<string, string>();
  for (const [i, arg] of process.argv.entries()) {
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const val = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : "true";
      args.set(key, val);
    }
  }

  const contract = args.get("contract");
  if (!contract) throw new Error("--contract is required");

  const rpc = args.get("rpc") || process.env.RPC_URL;
  const etherscanKey = args.get("etherscan-key") || process.env.ETHERSCAN_API_KEY;
  const network = (args.get("network") || "mainnet") as any;
  const provider = rpc
    ? new ethers.JsonRpcProvider(rpc)
    : (etherscanKey
        ? new ethers.EtherscanProvider(network, etherscanKey)
        : null);
  if (!provider) {
    throw new Error("Provide --rpc <url> or --etherscan-key <key> (or set ETHERSCAN_API_KEY)");
  }

  const roleIds = parseRoleIds(args.get("roles"));
  const result = await getRoles(provider, contract, roleIds);

  if (args.has("json")) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Contract: ${result.contract}`);
    for (const [name, info] of Object.entries(result.roles)) {
      console.log(`- ${name} (${info.role})` + (info.adminRole ? `, admin: ${info.adminRole}` : ""));
      for (const holder of info.holders) {
        console.log(`  • ${holder}`);
      }
      if (info.holders.length === 0) {
        console.log("  • (no holders found)");
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

