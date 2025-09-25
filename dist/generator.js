"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
const NA = 'Further verification required.';
const FENCE = '```';
function safe(value) {
    return (value && value.trim().length > 0) ? value : NA;
}
function bullet(items, indent = 0) {
    if (!items || items.length === 0)
        return `- ${NA}`;
    const prefix = '  '.repeat(indent) + '- ';
    return items.map(i => `${prefix}${i ?? NA}`).join('\n');
}
function table(rows, columns) {
    const header = `| ${columns.join(' | ')} |`;
    const sep = `| ${columns.map(() => '---').join(' | ')} |`;
    const body = rows.map(r => `| ${columns.map(c => r[c] ?? '').join(' | ')} |`).join('\n');
    return `${header}\n${sep}\n${body}`;
}
function generateReport(d, assetOverride) {
    const asset = assetOverride ?? d.assetName ?? 'AUSD';
    const issuerName = d.issuer?.companyName ?? NA;
    const snapshotRef = d.sources?.snapshotReference ?? NA;
    const reserveAssetsList = d.classification.reserveAssets?.map(a => a.link ? `${a.name} (${a.link})` : a.name) ?? [];
    const custodians = d.classification.custodian?.map(c => c.link ? `${c.name} (${c.link})` : c.name) ?? [];
    const s1_1_1_override = d.__llm?.s1_1_1 && typeof d.__llm.s1_1_1 === 'string' ? d.__llm.s1_1_1 : undefined;
    const s3_1_1_override = d.__llm?.s3_1_1 && typeof d.__llm.s3_1_1 === 'string' ? d.__llm.s3_1_1 : undefined;
    const s5_7_override = d.__llm?.s5_7 && typeof d.__llm.s5_7 === 'string' ? d.__llm.s5_7 : undefined;
    const classRows = [
        {
            'classification criteria': 'Primary Type',
            [`${asset} details`]: safe(d.classification.primaryType),
        },
        {
            'classification criteria': 'Backing Ratio',
            [`${asset} details`]: safe(d.classification.backingRatio),
        },
        {
            'classification criteria': 'Reserve Assets',
            [`${asset} details`]: reserveAssetsList.length ? reserveAssetsList.join(', ') : NA,
        },
        {
            'classification criteria': 'Peg Mechanism',
            [`${asset} details`]: safe(d.classification.pegMechanism),
        },
        {
            'classification criteria': 'Redemption Model',
            [`${asset} details`]: safe(d.classification.redemptionModel),
        },
        {
            'classification criteria': `${asset} Custodian`,
            [`${asset} details`]: custodians.length ? custodians.join(', ') : NA,
        },
        {
            'classification criteria': `${asset} Asset Manager`,
            [`${asset} details`]: safe(d.classification.assetManager),
        },
        {
            'classification criteria': 'Governance Structure',
            [`${asset} details`]: safe(d.classification.governanceStructure),
        },
        {
            'classification criteria': 'Regulatory Approach',
            [`${asset} details`]: safe(d.classification.regulatoryApproach),
        },
    ];
    const mintingPlatformRows = (d.adoption?.mintingPlatforms ?? []).map(mp => ({
        category: mp.category,
        'examples ( bulletpoints)': mp.examples.map(e => `- ${e}`).join('<br>'),
        'Access type': mp.accessType ?? NA,
        'KYC required (indicate the KYC required and be precise)': mp.kycRequired ?? NA,
    }));
    const managementRows = (d.ecosystemGovernance?.managementTable ?? []).map(x => ({
        Founder: x.founder ?? NA,
        Role: x.role ?? NA,
        Responsibilities: x.responsibilities ?? NA,
        'key strengths': x.keyStrengths ?? NA,
    }));
    const tokenTypeRows = (d.systemArchitecture?.keyTechnical?.crossChain?.tokenTypes ?? []).map(t => ({
        'token type': t.type,
        description: t.description ?? NA,
    }));
    const section1 = `### Stablecoin Fundamentals

Short overview: This section evaluates ${asset}'s purpose, reserve model, issuance/redemption mechanics, and governance, framed through risk. Key exposures include custody concentration, redemption friction, upgrade authority, and regulatory posture.

## 1.1 Description of the Stablecoin

### 1.1.1 Stablecoin Classification

${s1_1_1_override ?? `${asset} is analyzed as a ${safe(d.classification.primaryType)} stablecoin. The reserve structure (${reserveAssetsList.join(', ') || NA}) determines redemption reliability and regulatory profile: higher-quality, short-duration assets improve liquidity during stress but can embed interest rate and counterparty risks. Clarity on governance (${safe(d.classification.governanceStructure)}) and regulatory approach (${safe(d.classification.regulatoryApproach)}) affects institutional adoption. Strengths include simplicity and potential transparency; residual risks center on custodial dependencies, concentration in few institutions, and administrative control over mint/burn.`}

AUSD Classification Snapshot (source: ${snapshotRef})

${table(classRows, ['classification criteria', `${asset} details`])}

Simple comparison to other ${safe(d.classification.primaryType)} stablecoins: Position ${asset} versus peers (e.g., USDC, USDT, DAI) on reserve quality, disclosures, and governance. Where disclosures lag, adoption may be constrained.

### 1.1.2  User Adoption & Accessibility

Minting eligibility and access pathways shape who bears redemption frictions. ${safe(d.adoption?.institutionalAccess)} Institutions may access primary issuance; retail typically acquires via secondary markets and CeFi/DeFi rails. ${safe(d.adoption?.retailAccess)}

- Institutional Access
- Retail Access

Minting Platforms/Access Points and KYC requirements

${mintingPlatformRows.length ? table(mintingPlatformRows, ['category', 'examples ( bulletpoints)', 'Access type', 'KYC required (indicate the KYC required and be precise)']) : NA}

Fiat on/off ramps

Key risk is dependency on banking partners; outages or de-risking can delay redemptions and widen peg spreads.

${bullet(d.adoption?.fiatOnOffRamps)}

Supported wallets

Wallet support influences key management risks and end-user accessibility.

- EVM-Compatible Wallets
${bullet(d.adoption?.supportedWallets?.evm, 1)}
- Solana Ecosystem Wallets
${bullet(d.adoption?.supportedWallets?.solana, 1)}
- Sui Network Wallets
${bullet(d.adoption?.supportedWallets?.sui, 1)}
- Multi-Chain Solutions
${bullet(d.adoption?.supportedWallets?.multiChain, 1)}
- Institutional Custody Wallets
${bullet(d.adoption?.supportedWallets?.institutional, 1)}

**Geographic Accessibility**

${safe(d.adoption?.geographicAccessibility)}

Friction points for onboarding

Compliance, venue fragmentation, and custody setup can slow adoption.

${bullet(d.adoption?.frictionPoints)}

### 1.1.3 User Flow

Acquisition typically occurs via primary mint (institutions) or secondary markets (retail). Redemption mirrors this: primary redemptions against reserves, secondary via CEX/DEX liquidity with price impact.

Acquiring ${asset}

- Institutional User
Short narrative: KYC with ${issuerName}; deposit fiat to asset manager; on-chain mint; settlement.

${FENCE}mermaid
flowchart LR
A[KYC Verification] --> B[Deposit USD to ${safe(d.classification.assetManager)}] --> C[${issuerName} Smart Contract Mint] --> D[Token Distribution]
${FENCE}

- Retail User
Short narrative: Swap on DEX/CEX using available pairs; custody in supported wallet.

${FENCE}mermaid
flowchart LR
A[User sends swap request using crypto tokens] --> B[DEX/CEX smart contract executes the trade] --> C[User receives ${asset}]
${FENCE}

Redeeming ${asset}

- Institutional User
Short narrative: Burn tokens on-chain; fiat released via banking rails, subject to partner SLAs.

${FENCE}mermaid
flowchart LR
A[Redemption Request] --> B[${asset} collected] --> C[${issuerName} Smart Contract Burn tokens] --> D[Equivalent USD released]
${FENCE}

- Retail User
Short narrative: Swap ${asset} on DEX/CEX back into crypto/fiat; price depends on liquidity depth.

${FENCE}mermaid
flowchart LR
A[User sends swap request using ${asset}] --> B[DEX/CEX smart contract executes the trade] --> C[User receives crypto tokens]
${FENCE}

### 1.1.4 Reserves Overview

${safe(d.reservesOverview?.narrative)}

${bullet(d.reservesOverview?.assets)}

### 1.1.5 Fees and Business Model

Fee Model

${safe(d.feeModel?.narrative)}

${table((d.feeModel?.items ?? []).map(x => ({ Name: x.name, Description: x.description ?? NA, Rate: x.rate ?? NA })), ['Name', 'Description', 'Rate']) || NA}

Alternative Revenue Streams

${table((d.feeModel?.altRevenue ?? []).map(x => ({ 'revenue stream': x.name, descritption: x.description })), ['revenue stream', 'descritption']) || NA}

Executive summary

- Revenue Oversight
  - Revenue Allocation and Usage: ${safe(d.feeModel?.revenueOversight?.revenueAllocationUsage)}
  - Partner Revenue Sharing: ${safe(d.feeModel?.revenueOversight?.partnerRevenueSharing)}
  - Corporate Revenue Usage: ${safe(d.feeModel?.revenueOversight?.corporateRevenueUsage)}

Strategic Value Creation

${safe(d.feeModel?.strategicValueCreation)}

### 1.1.6 Ecosystem & Governance Overview

Legal Entity & Incorporation

- Full Legal Name:  ${issuerName}
- Incorporation (State/Country & Type): ${safe(d.issuer?.incorporation)}
- DBA / Operating Name: ${safe(d.issuer?.dba)}
- Mission / Purpose: ${safe(d.issuer?.mission)}
- Profit Status: ${safe(d.issuer?.profitStatus)}
- Legal Constraints / Charter Obligations: ${safe(d.issuer?.legalConstraints)}

Ownership & Beneficiaries

${safe(d.ecosystemGovernance?.ownershipSummary)}

Governance & Oversight

${safe(d.ecosystemGovernance?.governanceSummary)}

Management & Operations

${safe(d.ecosystemGovernance?.managementOpsSummary)}

Key Executives / Founders

${managementRows.length ? table(managementRows, ['Founder', 'Role', 'Responsibilities', 'key strengths']) : NA}

### 1.1.7 History

Significant updates can alter risk, especially around reserve policy, custody, governance, and cross-chain support.

${(d.history ?? []).length ? table((d.history ?? []).map(h => ({ date: h.date, 'update details': h.details })), ['date', 'update details']) : NA}
`;
    const section1_2 = `## 1.2 System Architecture Overview\n\n### 1.2.1 Background Workflow\n\n${safe(d.systemArchitecture?.backgroundWorkflow)}\n\n### 1.2.2 Architecture Diagram\n\n${FENCE}mermaid
flowchart LR
userFiat[Fiat Deposits] --> bank[Custodian Bank Accounts]
bank --> ops[Reserve Ops / Asset Manager]
ops -->|Mint Trigger| chain[${asset} Mint/Burn Smart Contracts]
redeem[Burn ${asset}] --> chain
chain -->|Settlement Instruction| bank
bank --> userUSD[Fiat Release to User]
${FENCE}\n\n### 1.2.3 Key Technical Components\n\n- Cross-chain Architecture\n${safe(d.systemArchitecture?.keyTechnical?.crossChain?.nativeChain)} is the native chain; bridging via ${safe(d.systemArchitecture?.keyTechnical?.crossChain?.bridgingProtocol)} to ${(d.systemArchitecture?.keyTechnical?.crossChain?.bridgedChains ?? []).join(', ') || NA}. Token types and behavior vary per chain and may affect integration risk.\n\n${tokenTypeRows.length ? table(tokenTypeRows, ['token type', 'description']) : NA}\n\n- Lockbox & Custodial Mechanisms\nRoles: ${(d.systemArchitecture?.keyTechnical?.lockbox?.roles ?? []).join(', ') || NA}. Type: ${safe(d.systemArchitecture?.keyTechnical?.lockbox?.lockboxType)}. Governance: ${safe(d.systemArchitecture?.keyTechnical?.lockbox?.governance)}. Multisig contracts: ${(d.systemArchitecture?.keyTechnical?.lockbox?.multisigContracts ?? []).join(', ') || NA}.\n\n- Bridging Models and Flow Control\nModel: ${safe(d.systemArchitecture?.keyTechnical?.bridgingModels)}. Flow control: ${safe(d.systemArchitecture?.keyTechnical?.flowControl)}.\n\n- Operational Oversight & Risk Considerations\n${bullet(d.systemArchitecture?.keyTechnical?.operationalRisks)}\n`;
    const section2 = `## Section 2: Market Performance & Risk Assessment\n\nThis section scopes market footprint, liquidity depth, and peg integrity, highlighting where market microstructure can amplify or mute redemption frictions.\n\n### 2.1 Market Performance Metrics\n\n#### 2.1.1 Outstanding and Free-Float Supply\n\n[CHART PLACEHOLDER]\n\nDescribe methodology: define outstanding vs. free-float; exclude treasury/blacklisted holdings; aggregate across chains.\n\n#### 2.1.2 Market Share in Overall Stablecoin Supply\n\n[CHART PLACEHOLDER]\n\nCompare market cap on primary chain versus similar-scale peers to avoid skew. Narrative: rank and share within category.\n\n#### 2.1.3 Supply Distribution\n\n[CHART PLACEHOLDER]\n\nBreak down by chain and holder category (exchanges, treasuries, smart contracts).\n\n#### 2.1.4 Transaction Count and Volume\n\n[CHART PLACEHOLDER]\n\nTotals and trend analysis across major chains.\n\n#### 2.1.5 Transfer Value Distribution\n\n[CHART PLACEHOLDER]\n\nWhale vs retail usage profile.\n\n#### 2.1.6 Stablecoin Velocity\n\n[CHART PLACEHOLDER]\n\nFrequency of transfers relative to supply.\n\n#### 2.1.7 Active Users\n\n[CHART PLACEHOLDER]\n\n#### 2.1.8 User Growth\n\n[CHART PLACEHOLDER]\n\n#### 2.1.9 Activity Distribution\n\n[CHART PLACEHOLDER]\n\nTop addresses by activity; concentration across chains.\n\n### 2.2 Peg Stability Metrics\n\n#### 2.2.1 Peg Deviation Frequency\n\n[CHART PLACEHOLDER]\n\n#### 2.2.2 Maximum Peg Deviation\n\n[CHART PLACEHOLDER]\n\n#### 2.2.3 Standard Deviation of Pegged Value\n\n[CHART PLACEHOLDER]\n\n#### 2.2.4 Market Depth at Pegged Value\n\n[CHART PLACEHOLDER]\n\n#### 2.2.5 Peg Recovery Time\n\n[CHART PLACEHOLDER]\n\n#### 2.2.6 Stress Testing Results\n\n[CHART PLACEHOLDER]\n\n### 2.3 Risk Metrics\n\n#### 2.3.1 Collateral Concentration Risk\n\n[CHART PLACEHOLDER]\n\n#### 2.3.3 Redemption Mechanism Risk\n\n[CHART PLACEHOLDER]\n\n#### 2.3.4 Run Risk Metrics\n\n[CHART PLACEHOLDER]\n\n#### 2.3.5 Risk-Return Allocation\n\n[CHART PLACEHOLDER]\n`;
    const section3 = `## SECTION 3: On-chain Management

Focus on smart-contract design, control surfaces, and operational processes that gate mint/burn and upgrades.

### 3.1 Operational Overview

#### 3.1.1 Smart Contract Structure

${s3_1_1_override ?? `${asset} smart contracts: addresses ${(d.onChainManagement?.smartContractStructure?.contractAddresses ?? []).join(', ') || NA}. Proxy admin owner: ${safe(d.onChainManagement?.smartContractStructure?.proxyAdminOwner)}. Chain nativity: ${safe(d.onChainManagement?.smartContractStructure?.chainNativity)}. Upgradeability: ${safe(d.onChainManagement?.smartContractStructure?.upgradeMechanism)}.`}

Mint/burn flow (on-chain focus): Minter ${safe(d.onChainManagement?.smartContractStructure?.minter)} exercises mint authorization under defined roles; Burner ${safe(d.onChainManagement?.smartContractStructure?.burner)} triggers supply reductions during redemptions or operational adjustments.

Chain deployment details

- ${(d.onChainManagement?.smartContractStructure?.chainDeployments ?? []).join('\n- ') || NA}

Bridging protocol: ${safe(d.onChainManagement?.smartContractStructure?.bridgingProtocol)}

${safe(d.onChainManagement?.smartContractStructure?.bridgingRisk)}

#### 3.1.2 Smart Contract Controls

Management type: ${safe(d.onChainManagement?.smartContractControls?.managementType)}. Lockboxes: ${safe(d.onChainManagement?.smartContractControls?.lockboxes)}. Roles and permissions delineate operational authority and are central to upgrade and mint security.

${(d.onChainManagement?.smartContractControls?.roles ?? []).map(r => `Role: ${r.role}: ${r.address} — ${r.description ?? ''}`).join('\n') || NA}

### 3.1.3 Dependencies

${safe(d.onChainManagement?.dependencies)}

### 3.1.4 Operational Security Practices

Incident Response

Uses ${safe(d.onChainManagement?.operationalSecurity?.managementRolesUsage)} roles to respond to incidents. History reference: ${safe(d.onChainManagement?.operationalSecurity?.incidentHistoryRef)}.

### 3.1.5 Oracle Mechanism

If fiat-backed, ${asset} peg management relies on off-chain procedures and attestations, not on-chain price oracles. DeFi integrations may still reference ecosystem oracles for pairs involving ${asset}.

### 3.2 Development and Security Metrics

Scope developer activity, documentation quality, and security posture.

#### 3.2.1 Development Activity

[GRAPH PLACEHOLDER]

#### 3.2.2 Number of Active Developers

[GRAPH PLACEHOLDER]

#### 3.2.3 Documentation Quality

Developer docs: ${safe(d.developmentSecurity?.developerDocs)}
GitHub: ${safe(d.developmentSecurity?.githubLink)}

Score using the provided framework and compute composite.

#### 3.2.4 Upgrade Frequency

[DESCRIPTION PLACEHOLDER]

#### 3.2.5 Smart Contract Audits

${(d.developmentSecurity?.audits ?? []).length ? (d.developmentSecurity?.audits ?? []).map(a => `Audited: ${a.audited ? 'Yes' : 'No'}; Updated: ${a.updated ?? NA}; Auditors: ${(a.auditors ?? []).join(', ') || NA}; Scope: ${a.scope ?? NA}; Date: ${a.date ?? NA}`).join('\n') : NA}

#### 3.2.6 Known Vulnerabilities Count

${(d.developmentSecurity?.knownVulnerabilities ?? []).length ? (d.developmentSecurity?.knownVulnerabilities ?? []).map(v => `${v.description} — Severity: ${v.severity} — Fixed: ${v.fixed === true ? 'Yes' : v.fixed === false ? 'No' : NA}`).join('\n') : NA}

#### 3.2.7 Bug Bounty Program Size

${safe(d.developmentSecurity?.bugBounty)}

#### 3.2.8 Historical Downtime

${safe(d.developmentSecurity?.downtime)}

#### 3.2.9 Time-to-Patch Metric

${safe(d.developmentSecurity?.timeToPatch)}
`;
    const section4 = `## Section 4: Regulation & Compliance

Evaluate reserve assurances, governance control, and regulatory obligations that shape legal risk and redemption reliability.

### 4.1 Reserves Oversight & Assurance

#### 4.1.1 Reserve Assets

Executive summary covering Composition, Liquidity, Quality, Transparency. Use ${safe(d.regulationCompliance?.reservesAttestationFileName)} and ${safe(d.regulationCompliance?.proofOfAssetReserves)} where available.

Custodians: ${(d.regulationCompliance?.custodians ?? []).map(c => `${c.name}${c.regulatoryStatus ? ' (' + c.regulatoryStatus + ')' : ''}`).join(', ') || NA}. Assets held per custodian should be disclosed with protections (e.g., insurance) where applicable.

Audit Results / Credentials: Indicate audit/attestation status and providers; cite documents.

#### 4.1.2 Overcollateralization Buffer

Define buffer and compute using ${safe(d.regulationCompliance?.reservesAttestationFileName)}. Discuss loss scenarios exceeding buffer and implications for redemptions.

#### 4.1.3 Custody of Reserves

Identity of custodians and security practices (ref: ${snapshotRef}). Segregation of assets between issuer and users is critical to bankruptcy remoteness.

#### 4.1.4 Attestations & Audits

Use ${safe(d.regulationCompliance?.proofOfAssetReserves)}. Frequency, independence, and public availability determine assurance quality.

#### 4.1.5 Payment Rails

${(d.regulationCompliance?.paymentRails ?? []).map(p => `- ${p.network}: ${p.settlementTime ?? ''} ${p.reliability ? `(${p.reliability})` : ''}`).join('\n') || NA}

### 4.2 Governance & Control

4.2.1 Governance Structure

Discuss centralization, upgrade authority, decision transparency, protection against compromised upgrades, and third-party roles.

### 4.3 Regulatory & Legal Compliance

Use ${safe(d.regulationCompliance?.termsAndUseFileName)} and other references.

#### 4.3.1 Licensing & Registrations

Detail licenses and registrations across jurisdictions.

#### 4.3.2 Sanctions & AML/KYC Compliance

Restricted jurisdictions, blacklist/whitelist mechanisms, and user KYC.

#### 4.3.3 User Restrictions

Eligibility and limitations (geography, age, institution type).

#### 4.3.4 Restrictions on Illegal Use

Terms and enforcement, including blacklisting/freezing controls.

#### 4.3.5 Customer Protection Measures

Disclosures, redemption rights, complaints, liabilities, and insolvency safeguards.
`;
    const section5 = `## 5. Risk Assessment

### 5.1 Reserve & Collateralization Risk

- Findings: ${asset} maintains reserves of {Reserve Value/Composition} against a circulating supply of {Supply Value}, resulting in a collateral buffer of {X%}. Peers typically range ${safe(d.riskAssessment?.peerRange)}.
- Stress Scenario: If {Y% of supply} were redeemed in 24h, buffers would {Outcome}.
- Risk Score: {1–5} — rationale.

### 5.2 Redemption Mechanism Risk

- Findings: Redemption relies on {mechanism}. Speed depends on {factors}. Transparency on limits/SLAs is {Strong/Weak}.
- Stress Scenario: If {disruption}, redemptions could {impact}.
- Risk Score: {1–5}.

### 5.3 Run Risk & Liquidity Depth

- Findings: On-chain liquidity concentrated in {Top Pools}. Depth = {Value} vs peers {Peer Value}. Slippage per 1m = {X%}. Pair diversification {high/low}.
- Stress Scenario: If {Y%} exit, slippage {Z%}; paired stable depeg worsens conditions.
- Risk Score: {1–5}.

### 5.4 Governance & Centralization Risk

- Findings: Governance model {model}. Privileges controlled by {entity/keys}. Decentralization {level}. Key risk {risk}.
- Benchmark: Compare to USDC (centralized licensed) and DAI (CDP-based).
- Stress Scenario: If {event}, impact {impact}.
- Risk Score: {1–5}.

### 5.5 Compliance & Regulatory Risk

- Findings: Issuer {jurisdiction}. Licenses {status}. Attestations by {party}. Standing vs peers {position}.
- Stress Scenario: If {regulatory event}, adoption/liquidity could {outcome}.
- Risk Score: {1–5}.

### 5.6 Composite Risk Rating

| Dimension | Score (1–5) | Risk Level |
| --- | --- | --- |
| Reserve & Collateralization | {X} | {Level} |
| Redemption Mechanism | {X} | {Level} |
| Run Risk & Liquidity Depth | {X} | {Level} |
| Governance & Centralization | {X} | {Level} |
| Compliance & Regulatory | {X} | {Level} |
| **Composite Weighted Score** | **{X}** | **{Level}** |

### 5.7 Analyst Conclusion

${s5_7_override ?? `${asset} demonstrates {Strengths} but carries {Weaknesses}. Overall Risk Rating: {Low/Medium/High}. Under stress (e.g., {scenarios}), peg resilience is {Strong/Weak} versus peers.`}
`;
    const disclaimer = `\n\nNote on Sources: Primary sources (whitepapers, official docs, audits, verified contracts) were prioritized. Where gaps exist, reputable secondary sources may be used; all unverifiable data are flagged as "${NA}".`;
    const sources = d.__sources;
    const sourcesBlock = sources && sources.length
        ? `\n\n### Sources\n${sources.map((s) => `- ${s}`).join('\n')}`
        : '';
    return [section1, section1_2, section2, section3, section4, section5, disclaimer + sourcesBlock].join('\n\n');
}
