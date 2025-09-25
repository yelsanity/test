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
        base_params = {
            "module": "account",
            "action": "tokentx",
            "contractaddress": contract_address,
            "startblock": start_block,
            "endblock": end_block,
            "sort": sort,
            "apikey": self.api_key,
        }
        for page_results in self.paginate(base_params, offset=offset, max_pages=max_pages):
            for item in page_results:
                yield item

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

