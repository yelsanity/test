from __future__ import annotations

from typing import Dict, Iterable, List, Optional, Set, Tuple


def aggregate_linked_addresses(
    transfers: Iterable[Dict],
    holders: Optional[Iterable[Dict]] = None,
    deployer_address: Optional[str] = None,
) -> Dict[str, Set[str]]:
    linked: Set[str] = set()
    senders: Set[str] = set()
    recipients: Set[str] = set()

    for t in transfers:
        from_addr = str(t.get("from", "")).lower()
        to_addr = str(t.get("to", "")).lower()
        if from_addr:
            linked.add(from_addr)
            senders.add(from_addr)
        if to_addr:
            linked.add(to_addr)
            recipients.add(to_addr)

    if holders is not None:
        for h in holders:
            addr = str(h.get("HolderAddress") or h.get("address") or "").lower()
            if addr:
                linked.add(addr)

    if deployer_address:
        linked.add(deployer_address.lower())

    return {
        "all": linked,
        "senders": senders,
        "recipients": recipients,
    }

