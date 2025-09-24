import { z } from 'zod';

export const ManagementPersonSchema = z.object({
  founder: z.string().optional(),
  role: z.string().optional(),
  responsibilities: z.string().optional(),
  keyStrengths: z.string().optional(),
});

export type ManagementPerson = z.infer<typeof ManagementPersonSchema>;

export const ClassificationSchema = z.object({
  primaryType: z.string(),
  backingRatio: z.string().optional(),
  reserveAssets: z.array(z.object({ name: z.string(), link: z.string().url().optional() })).optional(),
  pegMechanism: z.string().optional(),
  redemptionModel: z.string().optional(),
  custodian: z.array(z.object({ name: z.string(), link: z.string().url().optional() })).optional(),
  assetManager: z.string().optional(),
  governanceStructure: z.string().optional(),
  regulatoryApproach: z.string().optional(),
  peerComparisons: z.array(z.string()).optional(),
});

export const AdoptionSchema = z.object({
  institutionalAccess: z.string().optional(),
  retailAccess: z.string().optional(),
  mintingPlatforms: z.array(z.object({
    category: z.string(),
    examples: z.array(z.string()).default([]),
    accessType: z.string().optional(),
    kycRequired: z.string().optional(),
  })).optional(),
  fiatOnOffRamps: z.array(z.string()).optional(),
  supportedWallets: z.object({
    evm: z.array(z.string()).optional(),
    solana: z.array(z.string()).optional(),
    sui: z.array(z.string()).optional(),
    multiChain: z.array(z.string()).optional(),
    institutional: z.array(z.string()).optional(),
  }).optional(),
  geographicAccessibility: z.string().optional(),
  frictionPoints: z.array(z.string()).optional(),
}).optional();

export const EcosystemGovernanceSchema = z.object({
  ownershipSummary: z.string().optional(),
  governanceSummary: z.string().optional(),
  managementOpsSummary: z.string().optional(),
  managementTable: z.array(ManagementPersonSchema).optional(),
}).optional();

export const SystemArchitectureSchema = z.object({
  backgroundWorkflow: z.string().optional(),
  keyTechnical: z.object({
    crossChain: z.object({
      bridgingProtocol: z.string().optional(),
      nativeChain: z.string().optional(),
      bridgedChains: z.array(z.string()).optional(),
      tokenTypes: z.array(z.object({ type: z.string(), description: z.string().optional() })).optional(),
    }).optional(),
    lockbox: z.object({
      roles: z.array(z.string()).optional(),
      lockboxType: z.string().optional(),
      governance: z.string().optional(),
      multisigContracts: z.array(z.string()).optional(),
    }).optional(),
    bridgingModels: z.string().optional(),
    flowControl: z.string().optional(),
    operationalRisks: z.array(z.string()).optional(),
  }).optional(),
}).optional();

export const OnChainManagementSchema = z.object({
  smartContractStructure: z.object({
    contractAddresses: z.array(z.string()).optional(),
    proxyAdminOwner: z.string().optional(),
    chainNativity: z.string().optional(),
    upgradeMechanism: z.string().optional(),
    minter: z.string().optional(),
    burner: z.string().optional(),
    chainDeployments: z.array(z.string()).optional(),
    bridgingProtocol: z.string().optional(),
    bridgingRisk: z.string().optional(),
  }).optional(),
  smartContractControls: z.object({
    managementType: z.string().optional(),
    lockboxes: z.string().optional(),
    roles: z.array(z.object({ role: z.string(), address: z.string(), description: z.string().optional() })).optional(),
  }).optional(),
  dependencies: z.string().optional(),
  operationalSecurity: z.object({
    managementRolesUsage: z.string().optional(),
    incidentHistoryRef: z.string().optional(),
  }).optional(),
  oracleMechanism: z.string().optional(),
}).optional();

export const DevelopmentSecuritySchema = z.object({
  developerDocs: z.string().optional(),
  githubLink: z.string().optional(),
  audits: z.array(z.object({
    audited: z.boolean(),
    updated: z.string().optional(),
    auditors: z.array(z.string()).optional(),
    scope: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  knownVulnerabilities: z.array(z.object({ description: z.string(), severity: z.string(), fixed: z.boolean().optional() })).optional(),
  bugBounty: z.string().optional(),
  downtime: z.string().optional(),
  timeToPatch: z.string().optional(),
}).optional();

export const RegulationComplianceSchema = z.object({
  reservesAttestationFileName: z.string().optional(),
  proofOfAssetReserves: z.string().optional(),
  termsAndUseFileName: z.string().optional(),
  custodians: z.array(z.object({
    name: z.string(),
    regulatoryStatus: z.string().optional(),
    protectedBy: z.string().optional(),
    assetsHeld: z.array(z.string()).optional(),
  })).optional(),
  paymentRails: z.array(z.object({ network: z.string(), settlementTime: z.string().optional(), reliability: z.string().optional() })).optional(),
  licensing: z.string().optional(),
  sanctionsKYC: z.string().optional(),
  userRestrictions: z.string().optional(),
  illegalUse: z.string().optional(),
  customerProtection: z.string().optional(),
  governanceStructure: z.string().optional(),
}).optional();

export const RiskAssessmentSchema = z.object({
  peerRange: z.string().optional(),
}).optional();

export const FrameworkInputSchema = z.object({
  assetName: z.string().default('AUSD'),
  issuer: z.object({
    companyName: z.string().default('Further verification required.'),
    dba: z.string().optional(),
    incorporation: z.string().optional(),
    mission: z.string().optional(),
    profitStatus: z.string().optional(),
    legalConstraints: z.string().optional(),
  }).default({ companyName: 'Further verification required.' }),
  classification: ClassificationSchema,
  adoption: AdoptionSchema,
  ecosystemGovernance: EcosystemGovernanceSchema,
  systemArchitecture: SystemArchitectureSchema,
  onChainManagement: OnChainManagementSchema,
  developmentSecurity: DevelopmentSecuritySchema,
  regulationCompliance: RegulationComplianceSchema,
  riskAssessment: RiskAssessmentSchema,
  sources: z.object({ snapshotReference: z.string().optional() }).optional(),
  reservesOverview: z.object({
    narrative: z.string().optional(),
    assets: z.array(z.string()).optional(),
  }).optional(),
  feeModel: z.object({
    narrative: z.string().optional(),
    items: z.array(z.object({ name: z.string(), description: z.string().optional(), rate: z.string().optional() })).optional(),
    altRevenue: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
    revenueOversight: z.object({
      revenueAllocationUsage: z.string().optional(),
      partnerRevenueSharing: z.string().optional(),
      corporateRevenueUsage: z.string().optional(),
    }).optional(),
    strategicValueCreation: z.string().optional(),
  }).optional(),
  history: z.array(z.object({ date: z.string(), details: z.string() })).optional(),
});

export type FrameworkInput = z.infer<typeof FrameworkInputSchema>;

