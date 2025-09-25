from __future__ import annotations

import hashlib
from typing import Any, Dict, List, Optional, Tuple

from eth_abi import encode
from eth_utils import keccak, to_checksum_address

from .api import EtherscanClient


ACCESS_CONTROL_HAS_ROLE_SIG = "0x91d14854"  # hasRole(bytes32,address)
ACCESS_CONTROL_GET_ROLE_ADMIN_SIG = "0x248a9ca3"  # getRoleAdmin(bytes32)


def _role_hash(role_string: str) -> bytes:
    return keccak(text=role_string)


def _encode_function_call(selector: str, arg_types: List[str], args: List[Any]) -> str:
    return selector + encode(arg_types, args).hex()


def detect_common_roles(client: EtherscanClient, contract_address: str) -> Dict[str, str]:
    """Return mapping of role name -> role bytes32 hex for common roles.

    Does not require ABI: uses known AccessControl patterns.
    """
    common = {
        "DEFAULT_ADMIN_ROLE": b"\x00" * 32,
        "MINTER_ROLE": _role_hash("MINTER_ROLE"),
        "PAUSER_ROLE": _role_hash("PAUSER_ROLE"),
        "BURNER_ROLE": _role_hash("BURNER_ROLE"),
        "SNAPSHOT_ROLE": _role_hash("SNAPSHOT_ROLE"),
        "UPGRADER_ROLE": _role_hash("UPGRADER_ROLE"),
        "TRANSFER_ROLE": _role_hash("TRANSFER_ROLE"),
    }
    return {name: "0x" + value.hex() for name, value in common.items()}


def check_has_role(
    client: EtherscanClient, contract_address: str, role_hex: str, account: str
) -> Optional[bool]:
    data = _encode_function_call(ACCESS_CONTROL_HAS_ROLE_SIG, ["bytes32", "address"], [bytes.fromhex(role_hex[2:]), account])
    res = client.proxy_eth_call(to=contract_address, data=data)
    if res is None or len(res) < 66:
        return None
    # bool is encoded as 32-byte word, last byte 0x01 or 0x00
    try:
        return int(res[-1], 16) == 1
    except Exception:
        return None


def get_role_admin(client: EtherscanClient, contract_address: str, role_hex: str) -> Optional[str]:
    data = _encode_function_call(ACCESS_CONTROL_GET_ROLE_ADMIN_SIG, ["bytes32"], [bytes.fromhex(role_hex[2:])])
    res = client.proxy_eth_call(to=contract_address, data=data)
    if not res or len(res) < 66:
        return None
    # returns bytes32
    return "0x" + res[-64:]


def introspect_roles(
    client: EtherscanClient,
    contract_address: str,
    probe_admins: Optional[List[str]] = None,
) -> Dict[str, Any]:
    roles = detect_common_roles(client, contract_address)
    found: Dict[str, Any] = {}

    for name, role_hex in roles.items():
        admin = get_role_admin(client, contract_address, role_hex)
        found[name] = {
            "role": role_hex,
            "adminRole": admin,
            "holdersChecked": [],
        }
        if probe_admins:
            for addr in probe_admins:
                ok = check_has_role(client, contract_address, role_hex, addr)
                if ok is True:
                    found[name]["holdersChecked"].append(to_checksum_address(addr))
    return {
        "contract": contract_address,
        "roles": found,
    }

