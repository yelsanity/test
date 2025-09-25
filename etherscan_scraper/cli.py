from __future__ import annotations

import json
import csv
from typing import Optional

import click
from rich.console import Console
from rich.progress import Progress

from .api import EtherscanClient
from .analysis import aggregate_linked_addresses
from .roles import introspect_roles


console = Console()


@click.group()
def cli() -> None:
    pass


@cli.command()
@click.option("--contract", "contract_address", required=True, help="Token contract address")
@click.option("--network", default="mainnet", show_default=True, help="Network: mainnet, sepolia, goerli")
@click.option("--start-block", default=0, show_default=True, type=int)
@click.option("--end-block", default=99999999, show_default=True, type=int)
@click.option("--sort", default="asc", show_default=True, type=click.Choice(["asc", "desc"]))
@click.option("--include-holders", is_flag=True, default=False)
@click.option("--rate-limit", default=4.0, show_default=True, type=float)
@click.option("--max-pages", default=1000, show_default=True, type=int)
@click.option("--out-json", type=click.Path(dir_okay=False), default=None)
@click.option("--out-csv", type=click.Path(dir_okay=False), default=None)
def scrape(
    contract_address: str,
    network: str,
    start_block: int,
    end_block: int,
    sort: str,
    include_holders: bool,
    rate_limit: float,
    max_pages: int,
    out_json: Optional[str],
    out_csv: Optional[str],
) -> None:
    client = EtherscanClient(network=network, rate_limit_per_sec=rate_limit)

    console.print(f"[bold]Fetching transfers for[/bold] {contract_address} on {network}...")
    transfers = []
    with Progress() as progress:
        task = progress.add_task("Transfers", start=False)
        for item in client.get_token_transfers(
            contract_address=contract_address,
            start_block=start_block,
            end_block=end_block,
            sort=sort,
            offset=100,
            max_pages=max_pages,
        ):
            if not progress.tasks[task].started:
                progress.start_task(task)
            transfers.append(item)
            progress.advance(task)

    holders = []
    if include_holders:
        console.print("[bold]Fetching holders...[/bold]")
        with Progress() as progress:
            task = progress.add_task("Holders", start=False)
            for item in client.get_token_holders(contract_address=contract_address, offset=100, max_pages=max_pages):
                if not progress.tasks[task].started:
                    progress.start_task(task)
                holders.append(item)
                progress.advance(task)

    creation = client.get_contract_creation_tx(contract_address)
    deployer = creation.get("contractCreator") if creation else None

    linked = aggregate_linked_addresses(transfers, holders if include_holders else None, deployer)

    console.print(f"[bold green]Found[/bold green] {len(linked['all'])} unique addresses")
    if deployer:
        console.print(f"Deployer: {deployer}")

    result = {
        "contract": contract_address,
        "network": network,
        "counts": {
            "unique": len(linked["all"]),
            "senders": len(linked["senders"]),
            "recipients": len(linked["recipients"]),
            "holders": len(holders) if include_holders else None,
        },
        "deployer": deployer,
        "addresses": sorted(list(linked["all"]))
    }

    if out_json:
        with open(out_json, "w") as f:
            json.dump(result, f, indent=2)
        console.print(f"Wrote JSON: {out_json}")

    if out_csv:
        with open(out_csv, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["address"]) 
            for addr in sorted(list(linked["all"])):
                writer.writerow([addr])
        console.print(f"Wrote CSV: {out_csv}")

    # Print a small preview
    preview = sorted(list(linked["all"]))[:20]
    console.print("Sample addresses:")
    for a in preview:
        console.print(f" - {a}")


@cli.command()
@click.option("--contract", "contract_address", required=True, help="Contract address")
@click.option("--network", default="mainnet", show_default=True, help="Network: mainnet, sepolia, goerli")
@click.option("--probe-admin", multiple=True, help="Optional addresses to probe for role membership (repeat for multiple)")
@click.option("--out-json", type=click.Path(dir_okay=False), default=None)
def roles(contract_address: str, network: str, probe_admin: tuple[str, ...], out_json: Optional[str]) -> None:
    """Introspect AccessControl roles with minimal calls via eth_call.

    This fetches common role IDs and each role's admin role. If --probe-admin is
    supplied, it also checks those addresses for each role (best-effort).
    """
    client = EtherscanClient(network=network)
    console.print(f"[bold]Introspecting roles for[/bold] {contract_address} on {network}...")
    result = introspect_roles(client, contract_address, list(probe_admin) if probe_admin else None)

    if out_json:
        with open(out_json, "w") as f:
            json.dump(result, f, indent=2)
        console.print(f"Wrote JSON: {out_json}")
    else:
        console.print_json(data=result)

if __name__ == "__main__":
    cli()

