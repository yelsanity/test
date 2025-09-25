from __future__ import annotations

import os
import time
from typing import Any, Dict, Iterable, List, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential_jitter


NETWORK_TO_HOST = {
    "mainnet": "https://api.etherscan.io",
    "sepolia": "https://api-sepolia.etherscan.io",
    "goerli": "https://api-goerli.etherscan.io",
    # Extendable for Etherscan family: polygonscan, bscscan, etc.
}


class EtherscanClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        network: str = "mainnet",
        rate_limit_per_sec: float = 4.0,
        timeout_s: float = 30.0,
    ) -> None:
        self.api_key = api_key or os.environ.get("ETHERSCAN_API_KEY")
        if not self.api_key:
            raise ValueError("ETHERSCAN_API_KEY is required")

        if network not in NETWORK_TO_HOST:
            raise ValueError(f"Unsupported network: {network}")
        self.base_url = NETWORK_TO_HOST[network]

        self.client = httpx.Client(timeout=timeout_s)
        self.min_interval = 1.0 / rate_limit_per_sec if rate_limit_per_sec > 0 else 0.0
        self._last_request_time = 0.0

    def _rate_limit(self) -> None:
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self._last_request_time = time.time()

    @retry(reraise=True, stop=stop_after_attempt(5), wait=wait_exponential_jitter(initial=1, max=8))
    def _get(self, params: Dict[str, Any]) -> Dict[str, Any]:
        self._rate_limit()
        response = self.client.get(f"{self.base_url}/api", params=params)
        response.raise_for_status()
        data = response.json()
        if isinstance(data, dict) and data.get("status") == "0" and data.get("message") != "No transactions found":
            raise RuntimeError(f"Etherscan API error: {data}")
        return data

    def paginate(
        self,
        base_params: Dict[str, Any],
        page_start: int = 1,
        offset: int = 100,
        max_pages: int = 1000,
    ) -> Iterable[List[Dict[str, Any]]]:
        for page in range(page_start, page_start + max_pages):
            params = dict(base_params)
            params.update({"page": page, "offset": offset})
            data = self._get(params)
            result = data.get("result", [])
            if not result:
                break
            if not isinstance(result, list):
                break
            yield result
            if len(result) < offset:
                break

    def get_token_transfers(
        self,
        contract_address: str,
        start_block: int = 0,
        end_block: int = 99999999,
        sort: str = "asc",
        offset: int = 100,
        max_pages: int = 1000,
    ) -> Iterable[Dict[str, Any]]:
        """Yield ERC-20 transfer events for a contract, segmenting to avoid the
        10k window limit by advancing the start block as we go.

        Deduplicates by tx hash at segment boundaries to prevent double-yields
        when the last segment ends mid-block.
        """
        if sort != "asc":
            # Segmentation assumes ascending order over blocks
            raise ValueError("Only asc sort is supported for segmented fetching")

        seen_tx_hashes: set[str] = set()
        current_start = start_block
        safety_segments = 0

        while current_start <= end_block:
            safety_segments += 1
            if safety_segments > max_pages:
                break

            page = 1
            last_block_in_segment: Optional[int] = None

            while True:
                params = {
                    "module": "account",
                    "action": "tokentx",
                    "contractaddress": contract_address,
                    "startblock": current_start,
                    "endblock": end_block,
                    "sort": sort,
                    "page": page,
                    "offset": offset,
                    "apikey": self.api_key,
                }

                try:
                    data = self._get(params)
                except RuntimeError as exc:  # window too large or other API error
                    msg = str(exc)
                    if "Result window is too large" in msg:
                        # Advance to a new segment starting at the last known block
                        # If we have no data yet in the segment, bump start by 1 to avoid loops
                        if last_block_in_segment is None:
                            current_start += 1
                        else:
                            current_start = last_block_in_segment
                        break
                    raise

                result = data.get("result", [])
                if not result:
                    # No more results at this start; advance beyond the last block seen
                    if last_block_in_segment is None:
                        # Nothing returned even on first page -> fully done
                        return
                    current_start = last_block_in_segment + 1
                    break

                for item in result:
                    tx_hash = str(item.get("hash") or "").lower()
                    if tx_hash and tx_hash in seen_tx_hashes:
                        continue
                    if tx_hash:
                        seen_tx_hashes.add(tx_hash)
                    yield item

                try:
                    last_block_in_segment = int(result[-1]["blockNumber"])
                except Exception:
                    last_block_in_segment = last_block_in_segment if last_block_in_segment is not None else current_start

                # If fewer than offset, this segment is done; advance start
                if len(result) < offset:
                    current_start = (last_block_in_segment or current_start) + 1
                    break

                page += 1

                # Avoid exceeding the 10k window (page*offset <= 10000)
                if page > max(1, 10000 // max(1, offset)):
                    # Start next segment at the last block to include any remaining
                    # txs in that block; dedup via tx hash prevents duplicates
                    current_start = (last_block_in_segment or current_start)
                    break

    def get_token_holders(
        self,
        contract_address: str,
        offset: int = 100,
        max_pages: int = 1000,
    ) -> Iterable[Dict[str, Any]]:
        base_params = {
            "module": "token",
            "action": "tokenholderlist",
            "contractaddress": contract_address,
            "apikey": self.api_key,
        }
        for page_results in self.paginate(base_params, offset=offset, max_pages=max_pages):
            for item in page_results:
                yield item

    def get_contract_creation_tx(self, contract_address: str) -> Optional[Dict[str, Any]]:
        params = {
            "module": "contract",
            "action": "getcontractcreation",
            "contractaddresses": contract_address,
            "apikey": self.api_key,
        }
        data = self._get(params)
        result = data.get("result")
        if isinstance(result, list) and result:
            return result[0]
        return None

