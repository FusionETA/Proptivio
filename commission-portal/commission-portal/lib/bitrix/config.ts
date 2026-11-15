// Bitrix24 Configuration for Proptivio Commission SPA
// Commission SPA created 2026-11-15, entityTypeId 1316
// Categories: Transaction=254, Rate Setting=256, Statement Record=258, Approval=260
// IMPORTANT: Custom fields must be created manually in Bitrix24 UI by a Bitrix24 admin.
// After creating them, run: node deploy/fetch-field-names.js  to update field IDs.
export const BITRIX_CONFIG = {
    WEBHOOK_URL: 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/',
    ENTITY_TYPE_ID: 1316,
    CATEGORIES: {
        TRANSACTION: 254,
        STATEMENT_RECORD: 258,
        APPROVAL: 260,
    },
} as const;

// Field mappings for Commission SPA
// Custom field names follow pattern: UF_CRM_1316_<unix_timestamp>
// Update values below after creating fields in Bitrix24 UI.
export const BITRIX_FIELDS = {
    ID: 'id',
    TITLE: 'title',
    ASSIGNED_BY_ID: 'assignedById',
    CREATED_TIME: 'createdTime',
    UPDATED_TIME: 'updatedTime',
    PROCESS_DATE: 'ufCrm1316_PROCESS_DATE',
    TRANSACTION_DATE: 'ufCrm1316_TRANSACTION_DATE',
    ACCOUNT_NO: 'ufCrm1316_ACCOUNT_NO',
    BUYER_NAME: 'ufCrm1316_BUYER_NAME',
    PROJECT_DEVELOPER: 'ufCrm1316_PROJECT_DEVELOPER',
    TRANSACTION_AMOUNT: 'ufCrm1316_TRANSACTION_AMOUNT',
    COMMISSION_RATE: 'ufCrm1316_COMMISSION_RATE',
    COMMISSION_AMOUNT: 'ufCrm1316_COMMISSION_AMOUNT',
    DEVELOPER_RATE: 'ufCrm1316_DEVELOPER_RATE',
    DEVELOPER_INCOME: 'ufCrm1316_DEVELOPER_INCOME',
    DEVELOPER_PAYABLE_INCOME: 'ufCrm1316_DEVELOPER_PAYABLE_INCOME',
    AGENT_RATE: 'ufCrm1316_AGENT_RATE',
    AGENT_INCOME: 'ufCrm1316_AGENT_INCOME',
    AGENT_PAYABLE_INCOME: 'ufCrm1316_AGENT_PAYABLE_INCOME',
    DEAL_ID: 'ufCrm1316_DEAL_ID',
    TRANSACTION_RECORD_PARENT: 'ufCrm1316_TRANSACTION_RECORD_PARENT',
    ERROR_MESSAGE: 'ufCrm1316_ERROR_MESSAGE',
    INCOME: 'ufCrm1316_INCOME',
    APPROVAL_STATUS: 'ufCrm1316_APPROVAL_STATUS',
    STATEMENT_RECORD_CHILD: 'ufCrm1316_STATEMENT_RECORD_CHILD',
} as const;
