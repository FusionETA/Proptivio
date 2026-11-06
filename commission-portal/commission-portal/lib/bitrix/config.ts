// Bitrix24 Configuration for Proptivio Commission SPA
export const BITRIX_CONFIG = {
    WEBHOOK_URL: 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/',
    ENTITY_TYPE_ID: 1312,  // Commission SPA created 2026-11-05
    CATEGORIES: {
        TRANSACTION: 244,
        STATEMENT_RECORD: 248,
        APPROVAL: 250,
    },
} as const;

// Field mappings for Commission SPA
// TODO: Custom fields must be created manually in Bitrix24 UI.
// Go to CRM → Smart Processes → Commission → Settings → Fields → Add field.
// After creating them, update the ufCrm34_... field IDs below.
export const BITRIX_FIELDS = {
    // Common fields (always available)
    ID: 'id',
    TITLE: 'title',
    ASSIGNED_BY_ID: 'assignedById',
    CREATED_TIME: 'createdTime',
    UPDATED_TIME: 'updatedTime',

    // Custom fields — TODO: update IDs after creating fields in UI
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

    // STATEMENT RECORD PIPELINE specific
    INCOME: 'ufCrm34_INCOME',

    // Other fields
    APPROVAL_STATUS: 'ufCrm34_APPROVAL_STATUS',
    STATEMENT_RECORD_CHILD: 'ufCrm34_STATEMENT_RECORD_CHILD',
} as const;
