"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameworkInputSchema = exports.RiskAssessmentSchema = exports.RegulationComplianceSchema = exports.DevelopmentSecuritySchema = exports.OnChainManagementSchema = exports.SystemArchitectureSchema = exports.EcosystemGovernanceSchema = exports.AdoptionSchema = exports.ClassificationSchema = exports.ManagementPersonSchema = void 0;
const zod_1 = require("zod");
exports.ManagementPersonSchema = zod_1.z.object({
    founder: zod_1.z.string().optional(),
    role: zod_1.z.string().optional(),
    responsibilities: zod_1.z.string().optional(),
    keyStrengths: zod_1.z.string().optional(),
});
exports.ClassificationSchema = zod_1.z.object({
    primaryType: zod_1.z.string(),
    backingRatio: zod_1.z.string().optional(),
    reserveAssets: zod_1.z.array(zod_1.z.object({ name: zod_1.z.string(), link: zod_1.z.string().url().optional() })).optional(),
    pegMechanism: zod_1.z.string().optional(),
    redemptionModel: zod_1.z.string().optional(),
    custodian: zod_1.z.array(zod_1.z.object({ name: zod_1.z.string(), link: zod_1.z.string().url().optional() })).optional(),
    assetManager: zod_1.z.string().optional(),
    governanceStructure: zod_1.z.string().optional(),
    regulatoryApproach: zod_1.z.string().optional(),
    peerComparisons: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.AdoptionSchema = zod_1.z.object({
    institutionalAccess: zod_1.z.string().optional(),
    retailAccess: zod_1.z.string().optional(),
    mintingPlatforms: zod_1.z.array(zod_1.z.object({
        category: zod_1.z.string(),
        examples: zod_1.z.array(zod_1.z.string()).default([]),
        accessType: zod_1.z.string().optional(),
        kycRequired: zod_1.z.string().optional(),
    })).optional(),
    fiatOnOffRamps: zod_1.z.array(zod_1.z.string()).optional(),
    supportedWallets: zod_1.z.object({
        evm: zod_1.z.array(zod_1.z.string()).optional(),
        solana: zod_1.z.array(zod_1.z.string()).optional(),
        sui: zod_1.z.array(zod_1.z.string()).optional(),
        multiChain: zod_1.z.array(zod_1.z.string()).optional(),
        institutional: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
    geographicAccessibility: zod_1.z.string().optional(),
    frictionPoints: zod_1.z.array(zod_1.z.string()).optional(),
}).optional();
exports.EcosystemGovernanceSchema = zod_1.z.object({
    ownershipSummary: zod_1.z.string().optional(),
    governanceSummary: zod_1.z.string().optional(),
    managementOpsSummary: zod_1.z.string().optional(),
    managementTable: zod_1.z.array(exports.ManagementPersonSchema).optional(),
}).optional();
exports.SystemArchitectureSchema = zod_1.z.object({
    backgroundWorkflow: zod_1.z.string().optional(),
    keyTechnical: zod_1.z.object({
        crossChain: zod_1.z.object({
            bridgingProtocol: zod_1.z.string().optional(),
            nativeChain: zod_1.z.string().optional(),
            bridgedChains: zod_1.z.array(zod_1.z.string()).optional(),
            tokenTypes: zod_1.z.array(zod_1.z.object({ type: zod_1.z.string(), description: zod_1.z.string().optional() })).optional(),
        }).optional(),
        lockbox: zod_1.z.object({
            roles: zod_1.z.array(zod_1.z.string()).optional(),
            lockboxType: zod_1.z.string().optional(),
            governance: zod_1.z.string().optional(),
            multisigContracts: zod_1.z.array(zod_1.z.string()).optional(),
        }).optional(),
        bridgingModels: zod_1.z.string().optional(),
        flowControl: zod_1.z.string().optional(),
        operationalRisks: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
}).optional();
exports.OnChainManagementSchema = zod_1.z.object({
    smartContractStructure: zod_1.z.object({
        contractAddresses: zod_1.z.array(zod_1.z.string()).optional(),
        proxyAdminOwner: zod_1.z.string().optional(),
        chainNativity: zod_1.z.string().optional(),
        upgradeMechanism: zod_1.z.string().optional(),
        minter: zod_1.z.string().optional(),
        burner: zod_1.z.string().optional(),
        chainDeployments: zod_1.z.array(zod_1.z.string()).optional(),
        bridgingProtocol: zod_1.z.string().optional(),
        bridgingRisk: zod_1.z.string().optional(),
    }).optional(),
    smartContractControls: zod_1.z.object({
        managementType: zod_1.z.string().optional(),
        lockboxes: zod_1.z.string().optional(),
        roles: zod_1.z.array(zod_1.z.object({ role: zod_1.z.string(), address: zod_1.z.string(), description: zod_1.z.string().optional() })).optional(),
    }).optional(),
    dependencies: zod_1.z.string().optional(),
    operationalSecurity: zod_1.z.object({
        managementRolesUsage: zod_1.z.string().optional(),
        incidentHistoryRef: zod_1.z.string().optional(),
    }).optional(),
    oracleMechanism: zod_1.z.string().optional(),
}).optional();
exports.DevelopmentSecuritySchema = zod_1.z.object({
    developerDocs: zod_1.z.string().optional(),
    githubLink: zod_1.z.string().optional(),
    audits: zod_1.z.array(zod_1.z.object({
        audited: zod_1.z.boolean(),
        updated: zod_1.z.string().optional(),
        auditors: zod_1.z.array(zod_1.z.string()).optional(),
        scope: zod_1.z.string().optional(),
        date: zod_1.z.string().optional(),
    })).optional(),
    knownVulnerabilities: zod_1.z.array(zod_1.z.object({ description: zod_1.z.string(), severity: zod_1.z.string(), fixed: zod_1.z.boolean().optional() })).optional(),
    bugBounty: zod_1.z.string().optional(),
    downtime: zod_1.z.string().optional(),
    timeToPatch: zod_1.z.string().optional(),
}).optional();
exports.RegulationComplianceSchema = zod_1.z.object({
    reservesAttestationFileName: zod_1.z.string().optional(),
    proofOfAssetReserves: zod_1.z.string().optional(),
    termsAndUseFileName: zod_1.z.string().optional(),
    custodians: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        regulatoryStatus: zod_1.z.string().optional(),
        protectedBy: zod_1.z.string().optional(),
        assetsHeld: zod_1.z.array(zod_1.z.string()).optional(),
    })).optional(),
    paymentRails: zod_1.z.array(zod_1.z.object({ network: zod_1.z.string(), settlementTime: zod_1.z.string().optional(), reliability: zod_1.z.string().optional() })).optional(),
    licensing: zod_1.z.string().optional(),
    sanctionsKYC: zod_1.z.string().optional(),
    userRestrictions: zod_1.z.string().optional(),
    illegalUse: zod_1.z.string().optional(),
    customerProtection: zod_1.z.string().optional(),
    governanceStructure: zod_1.z.string().optional(),
}).optional();
exports.RiskAssessmentSchema = zod_1.z.object({
    peerRange: zod_1.z.string().optional(),
}).optional();
exports.FrameworkInputSchema = zod_1.z.object({
    assetName: zod_1.z.string().default('AUSD'),
    issuer: zod_1.z.object({
        companyName: zod_1.z.string().default('Further verification required.'),
        dba: zod_1.z.string().optional(),
        incorporation: zod_1.z.string().optional(),
        mission: zod_1.z.string().optional(),
        profitStatus: zod_1.z.string().optional(),
        legalConstraints: zod_1.z.string().optional(),
    }).default({ companyName: 'Further verification required.' }),
    classification: exports.ClassificationSchema,
    adoption: exports.AdoptionSchema,
    ecosystemGovernance: exports.EcosystemGovernanceSchema,
    systemArchitecture: exports.SystemArchitectureSchema,
    onChainManagement: exports.OnChainManagementSchema,
    developmentSecurity: exports.DevelopmentSecuritySchema,
    regulationCompliance: exports.RegulationComplianceSchema,
    riskAssessment: exports.RiskAssessmentSchema,
    sources: zod_1.z.object({ snapshotReference: zod_1.z.string().optional() }).optional(),
    reservesOverview: zod_1.z.object({
        narrative: zod_1.z.string().optional(),
        assets: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
    feeModel: zod_1.z.object({
        narrative: zod_1.z.string().optional(),
        items: zod_1.z.array(zod_1.z.object({ name: zod_1.z.string(), description: zod_1.z.string().optional(), rate: zod_1.z.string().optional() })).optional(),
        altRevenue: zod_1.z.array(zod_1.z.object({ name: zod_1.z.string(), description: zod_1.z.string() })).optional(),
        revenueOversight: zod_1.z.object({
            revenueAllocationUsage: zod_1.z.string().optional(),
            partnerRevenueSharing: zod_1.z.string().optional(),
            corporateRevenueUsage: zod_1.z.string().optional(),
        }).optional(),
        strategicValueCreation: zod_1.z.string().optional(),
    }).optional(),
    history: zod_1.z.array(zod_1.z.object({ date: zod_1.z.string(), details: zod_1.z.string() })).optional(),
});
