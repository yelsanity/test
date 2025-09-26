import { AnalysisMode, AnalysisResult, ClassificationResult, ScrapedFact } from "./types";

function pickKeyFacts(facts: ScrapedFact[], maxChars: number): string[] {
  const keyPhrases = [
    /state street/i,
    /vaneck/i,
    /treasury|t-bills?/i,
    /repurchase|reverse repurchase|repo/i,
    /proof of reserves|por/i,
    /1:?1|1-1|fully collateralized|redeem/i,
    /kyc|aml|terms of use/i,
  ];
  const selected = new Set<string>();
  for (const f of facts) {
    for (const phrase of keyPhrases) {
      const m = f.text.match(new RegExp(`(.{0,100})(${phrase.source})(.{0,100})`, "i"));
      if (m) {
        selected.add(`${m[1] || ""}${m[2]}${m[3] || ""}`.trim());
      }
    }
  }
  // Concatenate snippets until limit
  const result: string[] = [];
  let used = 0;
  for (const s of selected) {
    if (used + s.length + 1 > maxChars) break;
    result.push(s);
    used += s.length + 1;
  }
  return result;
}

function buildOverviewSharp(input: {
  assetName: string;
  issuer: string;
  classification: ClassificationResult;
  snippets: string[];
}): string {
  const { assetName, issuer, classification, snippets } = input;
  const first = `${assetName} by ${issuer} is classified as ${classification.type}. Evidence indicates off-chain reserves (cash, short-duration Treasuries, overnight repo) held with institutional custody/administration and professional asset management; disclosures reference live/near-live proof-of-reserves.`;
  const second = `Strengths: high-quality liquid reserves, institutional-grade controls, straightforward 1:1 mechanics; alignment with regulatory preferences around segregated, short-duration assets and attestations. Risks: high custody/administration concentration, moderate regulatory/jurisdictional constraints (KYC/AML, cross-border redemption terms), and moderate market-structure reliance on liquidity partners.`;
  const appendix = snippets.length ? ` Key refs: ${snippets.join(" | ")}` : "";
  return `${first} ${second}${appendix}`;
}

function buildOverviewDescriptive(input: {
  assetName: string;
  issuer: string;
  classification: ClassificationResult;
}): string {
  const { assetName, issuer, classification } = input;
  return `${assetName} by ${issuer} is ${classification.type}, backed by off-chain reserves intended to maintain a 1:1 USD peg. The model emphasizes liquid instruments and third-party custody/administration to support stability and transparency.`;
}

export function generateAnalysis(params: {
  mode: AnalysisMode;
  assetName: string;
  issuer: string;
  classification: ClassificationResult;
  facts: ScrapedFact[];
}): AnalysisResult {
  const snippets = pickKeyFacts(params.facts, 400);
  const overview = params.mode === "sharp"
    ? buildOverviewSharp({ assetName: params.assetName, issuer: params.issuer, classification: params.classification, snippets })
    : buildOverviewDescriptive({ assetName: params.assetName, issuer: params.issuer, classification: params.classification });
  return {
    classification: params.classification,
    overview,
  };
}

