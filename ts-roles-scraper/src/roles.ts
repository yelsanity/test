import { ethers } from "ethers";
import { AccessControlEnumerableABI, DEFAULT_ROLE_NAMES, RoleIdHex, RoleInfo, RolesResult } from "./types.js";

export const COMMON_ROLE_NAMES: Record<string, RoleIdHex> = Object.fromEntries(
  Object.entries(DEFAULT_ROLE_NAMES).map(([id, name]) => [name, id as RoleIdHex])
);

export function normalizeRoleName(roleId: RoleIdHex): string {
  return DEFAULT_ROLE_NAMES[roleId] ?? roleId;
}

export async function fetchRoleHoldersEnumerable(
  contract: ethers.Contract,
  role: RoleIdHex
): Promise<string[] | null> {
  try {
    const count: bigint = await contract.getRoleMemberCount(role);
    const holders: string[] = [];
    for (let i = 0n; i < count; i++) {
      const addr: string = await contract.getRoleMember(role, i);
      holders.push(ethers.getAddress(addr));
    }
    return holders;
  } catch {
    return null;
  }
}

async function fetchRoleHoldersFromEtherscanLogs(
  provider: ethers.Provider,
  contract: ethers.Contract,
  role: RoleIdHex,
  fromBlock: number,
  toBlock: number,
  apiKey: string,
  chunkSize: number
): Promise<string[]> {
  const iface = new ethers.Interface(AccessControlEnumerableABI as any);
  const roleTopic = ethers.keccak256(ethers.toUtf8Bytes("RoleGranted(bytes32,address,address)"));
  const roleRevokedTopic = ethers.keccak256(ethers.toUtf8Bytes("RoleRevoked(bytes32,address,address)"));
  const granted = new Set<string>();

  const chainId = (await provider.getNetwork()).chainId;
  const host = chainId === 1n
    ? "https://api.etherscan.io"
    : chainId === 11155111n
      ? "https://api-sepolia.etherscan.io"
      : chainId === 5n
        ? "https://api-goerli.etherscan.io"
        : "https://api.etherscan.io";

  async function queryLogs(topic0: string, start: number, end: number) {
    const url = new URL("/api", host);
    url.searchParams.set("module", "logs");
    url.searchParams.set("action", "getLogs");
    url.searchParams.set("address", contract.target as string);
    url.searchParams.set("fromBlock", String(start));
    url.searchParams.set("toBlock", String(end));
    url.searchParams.set("topic0", topic0);
    url.searchParams.set("topic1", role);
    url.searchParams.set("apikey", apiKey);
    const res = await fetch(url.toString());
    const data = await res.json();
    if (!data || data.status === "0") return [] as any[];
    return data.result as any[];
  }

  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, toBlock);
    const [grants, revokes] = await Promise.all([
      queryLogs(roleTopic, start, end),
      queryLogs(roleRevokedTopic, start, end),
    ]);
    for (const log of grants) {
      const topic = log.topics[2] as string;
      const account = ethers.getAddress("0x" + topic.slice(topic.length - 40));
      granted.add(account);
    }
    for (const log of revokes) {
      const topic = log.topics[2] as string;
      const account = ethers.getAddress("0x" + topic.slice(topic.length - 40));
      granted.delete(account);
    }
  }
  return Array.from(granted).sort();
}

export async function fetchRoleHoldersFromLogs(
  provider: ethers.Provider,
  contract: ethers.Contract,
  role: RoleIdHex,
  fromBlock: number | bigint = 0,
  toBlock: number | bigint | "latest" = "latest",
  chunkSize: number = 200_000,
  etherscanApiKey?: string
): Promise<string[]> {
  const iface = new ethers.Interface(AccessControlEnumerableABI as any);
  const roleTopic = ethers.keccak256(ethers.toUtf8Bytes("RoleGranted(bytes32,address,address)"));
  const roleRevokedTopic = ethers.keccak256(ethers.toUtf8Bytes("RoleRevoked(bytes32,address,address)"));

  const latestBlock = toBlock === "latest" ? await provider.getBlockNumber() : Number(toBlock);
  const startBlock = Number(fromBlock);

  // Query in chunks to satisfy providers that reject huge ranges
  let effectiveChunk = chunkSize;
  // Etherscan getLogs unsupported via EtherscanProvider; use API fallback
  const isEtherscan = (provider as any) instanceof (ethers as any).EtherscanProvider;
  if (isEtherscan) {
    effectiveChunk = Math.min(effectiveChunk, 10_000);
    if (!etherscanApiKey) throw new Error("Etherscan API key required for log scan with Etherscan provider");
    return fetchRoleHoldersFromEtherscanLogs(
      provider,
      contract,
      role,
      startBlock,
      latestBlock,
      etherscanApiKey,
      effectiveChunk
    );
  }

  const granted = new Set<string>();
  for (let start = startBlock; start <= latestBlock; start += effectiveChunk) {
    const end = Math.min(start + effectiveChunk - 1, latestBlock);
    const base = {
      address: contract.target as string,
      fromBlock: start,
      toBlock: end,
    } as const;
    const [grantedLogs, revokedLogs] = await Promise.all([
      provider.getLogs({
        ...base,
        topics: [roleTopic, role, null, null],
      }),
      provider.getLogs({
        ...base,
        topics: [roleRevokedTopic, role, null, null],
      }),
    ]);
    for (const log of grantedLogs) {
      const topic = log.topics[2];
      const account = ethers.getAddress("0x" + topic.slice(topic.length - 40));
      granted.add(account);
    }
    for (const log of revokedLogs) {
      const topic = log.topics[2];
      const account = ethers.getAddress("0x" + topic.slice(topic.length - 40));
      granted.delete(account);
    }
  }
  return Array.from(granted).sort();
}

export async function getRoles(
  provider: ethers.Provider,
  contractAddress: string,
  roleIds: RoleIdHex[],
  etherscanApiKey?: string
): Promise<RolesResult> {
  const contract = new ethers.Contract(contractAddress, AccessControlEnumerableABI, provider);
  const checksum = ethers.getAddress(contractAddress);
  const roles: Record<string, RoleInfo> = {};

  for (const role of roleIds) {
    let adminRole: RoleIdHex | null = null as any;
    try {
      adminRole = (await contract.getRoleAdmin(role)) as RoleIdHex;
    } catch {
      adminRole = null;
    }

    let holders: string[] | null = await fetchRoleHoldersEnumerable(contract, role);
    if (!holders) {
      holders = await fetchRoleHoldersFromLogs(provider, contract, role, 0, "latest", 200_000, etherscanApiKey);
    }

    const name = normalizeRoleName(role);
    roles[name] = {
      role,
      adminRole,
      holders,
    };
  }

  return { contract: checksum, roles };
}

