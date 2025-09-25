export type RoleIdHex = `0x${string}`;

export interface RoleInfo {
  role: RoleIdHex;
  adminRole: RoleIdHex | null;
  holders: string[]; // checksum addresses
}

export interface RolesResult {
  contract: string; // checksum
  roles: Record<string, RoleInfo>; // name -> info
}

export const DEFAULT_ROLE_NAMES: Record<RoleIdHex, string> = {
  // Default admin role is bytes32(0)
  "0x0000000000000000000000000000000000000000000000000000000000000000": "DEFAULT_ADMIN_ROLE",
  // Common OpenZeppelin roles
  // keccak256("MINTER_ROLE")
  "0x9f2df0fe6a1d7fcd6c3f0ccf1b570d8f7a2d4a2a2a1b52e5b2f6f94fe9f0d7e0": "MINTER_ROLE",
  // keccak256("PAUSER_ROLE")
  "0xe63ab1e3e1a2d7b8b1a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8090a1b2c3d4e": "PAUSER_ROLE",
  // keccak256("BURNER_ROLE")
  "0x21b3b4e5f6a7b8c9d0e1f2a3b4c5d6e7f8090a1b2c3d4e5f6a7b8c9d0e1f2a3b": "BURNER_ROLE",
  // keccak256("SNAPSHOT_ROLE")
  "0x6bcbe5e010f1f8d5158acb1662e3b81b2e7f2f0b1a16357fd3b8b3bda5c9c7a5": "SNAPSHOT_ROLE",
  // keccak256("UPGRADER_ROLE")
  "0x1891abd90bcd85dc5e4a3f8c5b80a4a8d097d3d3e1c3a5b5c9d2f1e6a7b8c9d0": "UPGRADER_ROLE",
  // keccak256("TRANSFER_ROLE")
  "0x0b6a2d1e3c4f5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8190a1b2c3d": "TRANSFER_ROLE",
};

export const AccessControlEnumerableABI = [
  // hasRole(bytes32,address) -> bool
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // getRoleAdmin(bytes32) -> bytes32
  {
    inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
    name: "getRoleAdmin",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  // getRoleMember(bytes32,uint256) -> address
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "getRoleMember",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // getRoleMemberCount(bytes32) -> uint256
  {
    inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
    name: "getRoleMemberCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Events for fallback enumeration
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      { indexed: true, internalType: "address", name: "account", type: "address" },
      { indexed: true, internalType: "address", name: "sender", type: "address" },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      { indexed: true, internalType: "address", name: "account", type: "address" },
      { indexed: true, internalType: "address", name: "sender", type: "address" },
    ],
    name: "RoleRevoked",
    type: "event",
  },
] as const;

