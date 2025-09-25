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

export async function fetchRoleHoldersFromLogs(
  provider: ethers.Provider,
  contract: ethers.Contract,
  role: RoleIdHex,
  fromBlock: number | bigint = 0,
  toBlock: number | bigint | "latest" = "latest"
): Promise<string[]> {
  const iface = new ethers.Interface(AccessControlEnumerableABI as any);
  const roleTopic = ethers.keccak256(ethers.toUtf8Bytes("RoleGranted(bytes32,address,address)"));
  const roleRevokedTopic = ethers.keccak256(ethers.toUtf8Bytes("RoleRevoked(bytes32,address,address)"));

  const latestBlock = toBlock === "latest" ? await provider.getBlockNumber() : Number(toBlock);
  const startBlock = Number(fromBlock);

  // Query in chunks to satisfy providers that reject huge ranges
  const chunkSize = 200_000; // adjust if provider complains
  const granted = new Set<string>();

  for (let start = startBlock; start <= latestBlock; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, latestBlock);
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
      // topic[2] is indexed account (bytes32)
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
  roleIds: RoleIdHex[]
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
      holders = await fetchRoleHoldersFromLogs(provider, contract, role);
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

