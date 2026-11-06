// Commission Trigger Configuration
// Maps deal stages to commission rates for the Progressive Billing pipeline

export const COMMISSION_CONFIG = {
    // Progressive Billing Pipeline ID (Deal pipeline)
    PIPELINE_ID: 150,

    // Webhook URL for commission operations
    WEBHOOK_URL: 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/',

    // Proptivio Commission SPA Entity Type ID (created 2026-11-05)
    COMMISSION_ENTITY_TYPE_ID: 1312,

    // Commission stages with their rates (C150 = Progressive Billing pipeline)
    // Key: Stage ID, Value: Commission configuration
    STAGES: {
        'C150:PREPARATION': {
            name: 'Site Clearing',
            rate: 0.02, // 2% - default, will be overridden by Rate Setting
            stageNumber: 1,
            description: 'First stage commission - Site Clearing',
        },
        'C150:PREPAYMENT_INVOI': {
            name: 'Piling Work',
            rate: 0.01, // 1% - default, will be overridden by Rate Setting
            stageNumber: 2,
            description: 'Second stage commission - Piling Work',
        },
        'C150:EXECUTING': {
            name: 'Concrete Reinforcement',
            rate: 0.02, // 2% - default, will be overridden by Rate Setting
            stageNumber: 3,
            description: 'Third stage commission - Concrete Reinforcement',
        },
    },

    // Proptivio Commission SPA Categories/Pipelines (created 2026-11-05)
    CATEGORIES: {
        TRANSACTION: 244,       // For commission transaction records
        RATE_SETTING: 246,      // For commission rate configuration
        STATEMENT_RECORD: 248,  // For statement records
        APPROVAL: 250,          // For approval workflow
    },
} as const;

// Commission SPA field mappings
// TODO: Custom fields must be created manually in Bitrix24 UI.
// Go to CRM → Smart Processes → Commission → Settings → Fields → Add field.
// After creating them, update the ufCrm34_... field IDs below.
// (The prefix ufCrm34_ is estimated for entityTypeId 1312 — verify after creation.)
export const COMMISSION_FIELDS = {
    // Core fields (always available)
    ID: 'id',
    TITLE: 'title',
    CATEGORY_ID: 'categoryId',
    ASSIGNED_BY_ID: 'assignedById',

    // Transaction fields — TODO: update IDs after creating fields in UI
    PROCESS_DATE: 'ufCrm34_PROCESS_DATE',
    TRANSACTION_DATE: 'ufCrm34_TRANSACTION_DATE',
    ACCOUNT_NO: 'ufCrm34_ACCOUNT_NO',
    BUYER_NAME: 'ufCrm34_BUYER_NAME',
    PROJECT_DEVELOPER: 'ufCrm34_PROJECT_DEVELOPER',
    TRANSACTION_AMOUNT: 'ufCrm34_TRANSACTION_AMOUNT',
    COMMISSION_RATE: 'ufCrm34_COMMISSION_RATE',
    COMMISSION_AMOUNT: 'ufCrm34_COMMISSION_AMOUNT',
    DEVELOPER_RATE: 'ufCrm34_DEVELOPER_RATE',
    DEVELOPER_INCOME: 'ufCrm34_DEVELOPER_INCOME',
    DEVELOPER_PAYABLE_INCOME: 'ufCrm34_DEVELOPER_PAYABLE_INCOME',
    AGENT_RATE: 'ufCrm34_AGENT_RATE',
    AGENT_INCOME: 'ufCrm34_AGENT_INCOME',
    AGENT_PAYABLE_INCOME: 'ufCrm34_AGENT_PAYABLE_INCOME',
    DEAL_ID: 'ufCrm34_DEAL_ID',
    TRANSACTION_RECORD_PARENT: 'ufCrm34_TRANSACTION_RECORD_PARENT',
    ERROR_MESSAGE: 'ufCrm34_ERROR_MESSAGE',
    APPROVAL_STATUS: 'ufCrm34_APPROVAL_STATUS',
    INCOME: 'ufCrm34_INCOME',
    STATEMENT_RECORD_CHILD: 'ufCrm34_STATEMENT_RECORD_CHILD',
} as const;

// Type for commission stage configuration
export type CommissionStage = {
    name: string;
    rate: number;
    stageNumber: number;
    description: string;
};

// Type for deal data received from webhook
export interface DealStageChangeEvent {
    dealId: number;
    stageId: string;
    categoryId: number;
    opportunity: number; // Total purchase price
    title?: string;
    contactId?: number;
    companyId?: number;
    assignedById?: number;
}

// Type for commission record to be created
export interface CommissionRecord {
    dealId: number;
    stageId: string;
    stageName: string;
    stageNumber: number;
    transactionAmount: number;
    commissionRate: number;
    commissionAmount: number;
    transactionDate: string;
    buyerName?: string;
    projectName?: string;
    developerRate?: number;
    developerIncome?: number;
    agentRate?: number;
    agentIncome?: number;
}

// Type for rate setting from Rate Setting pipeline
export interface RateSetting {
    id: number;
    title: string;
    developerRate: number;  // Percentage as decimal (0.5 = 50%)
    agentRate: number;      // Percentage as decimal (0.5 = 50%)
    commissionRate?: number; // Overall commission rate if set
}
