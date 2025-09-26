export type AnalysisMode = "sharp" | "descriptive";

export interface StablecoinInput {
  assetName: string;
  issuer: string;
  urls: string[];
  mode: AnalysisMode;
}

export interface ScrapedFact {
  sourceUrl: string;
  text: string;
}

export interface ReserveSignals {
  mentionsCash: boolean;
  mentionsTBills: boolean;
  mentionsRepo: boolean;
  mentionsMMF: boolean;
  mentionsPoR: boolean;
  mentionsCustodian: boolean;
  mentionsManager: boolean;
  custodianNames: string[];
  managerNames: string[];
}

export type StablecoinType =
  | "Fiat-Backed Fully Collateralized (1:1)"
  | "Fiat-Backed Partially Collateralized"
  | "Commodity-Backed Gold"
  | "Commodity-Backed Other"
  | "Crypto-Backed Over-Collateralized"
  | "Crypto-Backed Hybrid Collateral"
  | "Crypto-Backed Partially Collateralized"
  | "Algorithmic Pure"
  | "Algorithmic Fractional"
  | "Algorithmic Rebasing"
  | "RWA Treasury-Backed"
  | "RWA Bank-Deposit Tokenized"
  | "Hybrid Collateral + Governance Token"
  | "Hybrid Collateral + Yield-Bearing";

export interface ClassificationResult {
  type: StablecoinType;
  confidence: number; // 0..1
  rationale: string;
}

export interface AnalysisResult {
  classification: ClassificationResult;
  overview: string; // 1-2 paragraphs
}

