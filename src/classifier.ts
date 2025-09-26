import { ClassificationResult, ReserveSignals, StablecoinType } from "./types";

export function classifyFromSignals(signals: ReserveSignals): ClassificationResult {
  // Heuristic rules:
  // If cash/T-bills/repo and custodian mentioned -> Fiat-Backed 1:1
  if ((signals.mentionsCash || signals.mentionsTBills || signals.mentionsRepo || signals.mentionsMMF) && signals.mentionsCustodian) {
    const parts: string[] = [];
    if (signals.mentionsTBills) parts.push("T-bills");
    if (signals.mentionsCash) parts.push("cash");
    if (signals.mentionsRepo) parts.push("repo");
    if (signals.mentionsMMF) parts.push("MMF");
    const cust = signals.custodianNames.join(", ") || "named custodian";
    const mgr = signals.managerNames.join(", ") || "asset manager";
    const rationale = `Mentions ${parts.join("/")} with off-chain custody (${cust}) and management (${mgr}); consistent with 1:1 fiat-backed reserves.`;
    return {
      type: "Fiat-Backed Fully Collateralized (1:1)",
      confidence: 0.9,
      rationale,
    };
  }

  // If only T-bills/MMF without custodians, still likely fiat-backed but lower confidence
  if (signals.mentionsTBills || signals.mentionsMMF || signals.mentionsCash) {
    return {
      type: "Fiat-Backed Fully Collateralized (1:1)",
      confidence: 0.6,
      rationale: "Mentions cash/T-bills/MMF consistent with fiat-backed reserves; custodian not clearly identified.",
    };
  }

  // Fallback: unknown -> classify conservatively as crypto-backed hybrid (very low confidence)
  const fallback: StablecoinType = "Crypto-Backed Hybrid Collateral";
  return {
    type: fallback,
    confidence: 0.2,
    rationale: "Insufficient signals for off-chain fiat reserves; defaulting to hybrid crypto-backed with low confidence.",
  };
}

