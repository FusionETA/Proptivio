// Bitrix24 Configuration for Proptivio Commission SPA
// Commission SPA: entityTypeId=1316, internal id=220, created 2026-11-15
// Categories: Transaction=254, Rate Setting=256, Statement Record=258, Approval=260
// Custom fields use prefix UF_CRM_220_ (based on internal SPA id, not entityTypeId)
export const BITRIX_CONFIG = {
    WEBHOOK_URL: 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/',
    ENTITY_TYPE_ID: 1316,
    CATEGORIES: {
        TRANSACTION: 254,
        STATEMENT_RECORD: 258,
        APPROVAL: 260,
    },
} as const;

// Field mappings — all fields verified in Bitrix24 (ids 15174–15212)
export const BITRIX_FIELDS = {
    ID: 'id',
    TITLE: 'title',
    ASSIGNED_BY_ID: 'assignedById',
    CREATED_TIME: 'createdTime',
    UPDATED_TIME: 'updatedTime',
    PROCESS_DATE: 'ufCrm220ProcessDate',
    TRANSACTION_DATE: 'ufCrm220TransactionDate',
    ACCOUNT_NO: 'ufCrm220AccountNo',
    BUYER_NAME: 'ufCrm220BuyerName',
    PROJECT_DEVELOPER: 'ufCrm220ProjectDeveloper',
    TRANSACTION_AMOUNT: 'ufCrm220TransactionAmount',
    COMMISSION_RATE: 'ufCrm220CommissionRate',
    COMMISSION_AMOUNT: 'ufCrm220CommissionAmount',
    DEVELOPER_RATE: 'ufCrm220DeveloperRate',
    DEVELOPER_INCOME: 'ufCrm220DeveloperIncome',
    DEVELOPER_PAYABLE_INCOME: 'ufCrm220DeveloperPayableIncome',
    AGENT_RATE: 'ufCrm220AgentRate',
    AGENT_INCOME: 'ufCrm220AgentIncome',
    AGENT_PAYABLE_INCOME: 'ufCrm220AgentPayableIncome',
    DEAL_ID: 'ufCrm220DealId',
    TRANSACTION_RECORD_PARENT: 'ufCrm220TransactionRecordParent',
    ERROR_MESSAGE: 'ufCrm220ErrorMessage',
    INCOME: 'ufCrm220Income',
    APPROVAL_STATUS: 'ufCrm220ApprovalStatus',
    STATEMENT_RECORD_CHILD: 'ufCrm220StatementRecordChild',
} as const;
