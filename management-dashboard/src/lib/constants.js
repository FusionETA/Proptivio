
export const BITRIX_URL = 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/';

// Pipeline IDs
export const PIPELINES = {
    SALES_BOOKING: 148,      // Sales & Booking pipeline
    PROGRESSIVE_BILLING: 150 // Progressive Billing pipeline
};

// Product Catalog Sections
export const PRODUCT_SECTIONS = {
    GEN_SOHO: 108,  // Property Unit-ABC Soho
    RETAIL: 110     // Property Unit-Retail
};

// Sales Stages (in order of progression)
export const SALES_STAGES = {
    NEW_BOOKING: 'C148:NEW',
    OTP_ISSUED: 'C148:PREPARATION',
    DEPOSIT_VERIFICATION: 'C148:PREPAYMENT_INVOI',
    LOAN_APPLICATION: 'C148:EXECUTING',
    SPA_PREPARATION: 'C148:FINAL_INVOICE',
    SPA_STAMPING: 'C148:UC_SPA_STAMP',
    FOREIGN_APPROVAL: 'C148:UC_FOREIGN_APPR',
    COMPLETED: 'C148:WON',
    CANCELLED: 'C148:LOSE'
};

// Stage order for comparison
export const STAGE_ORDER = [
    'C148:NEW',
    'C148:PREPARATION',
    'C148:PREPAYMENT_INVOI',
    'C148:EXECUTING',
    'C148:FINAL_INVOICE',
    'C148:UC_SPA_STAMP',
    'C148:UC_FOREIGN_APPR',
    'C148:WON'
];

// Toggle definitions - which stages count as "sold"
export const SOLD_DEFINITIONS = {
    BOOKING_PAID: ['C148:PREPAYMENT_INVOI', 'C148:EXECUTING', 'C148:FINAL_INVOICE', 'C148:UC_SPA_STAMP', 'C148:UC_FOREIGN_APPR', 'C148:WON'],
    BANK_LOAN_APPROVED: ['C148:FINAL_INVOICE', 'C148:UC_SPA_STAMP', 'C148:UC_FOREIGN_APPR', 'C148:WON'],
    SPA_COMPLETED: ['C148:WON']
};

export const BOOKING_EXCLUDED_STAGES = [
    'C148:LOSE'
];

export const NATIONALITY_FIELD_ID = 'UF_CRM_NATIONALITY';

// Construction Cost Constants
export const CONSTRUCTION_PIPELINE_ID = 152;
export const LOA_ENTITY_TYPE = 1300;
export const VO_ENTITY_TYPE = 1304;
export const CLAIM_ENTITY_TYPE = 1308;

// NOTE: SPA custom fields must be created manually in Bitrix24 UI.
// Go to CRM → Smart Processes → (LOA/VO/Claims) → Settings → Fields → Add field.
// After creating them, update the field IDs below.
export const LOA_FIELDS = {
    MILESTONE_NAME: 'ufCrm12_MILESTONE_NAME',   // TODO: update after manual UI creation
    LOA_NUMBER: 'ufCrm12_LOA_NUMBER',
    LOA_DATE: 'ufCrm12_LOA_DATE',
    APPROVED_VO: 'ufCrm12_APPROVED_VO',
    TRUE_CONTRACT_VALUE: 'ufCrm12_TRUE_CONTRACT_VALUE', // Planned Budget
    PARENT_MILESTONE: 'parentId2'
};

export const VO_FIELDS = {
    VO_NUMBER: 'ufCrm14_VO_NUMBER',
    VO_DESCRIPTION: 'ufCrm14_VO_DESCRIPTION',
    VO_TYPE: 'ufCrm14_VO_TYPE',                 // enum: Add / Omit
    PARENT_LOA: 'parentId1050'
};

export const CLAIM_FIELDS = {
    CLAIM_AMOUNT: 'ufCrm16_CLAIM_AMOUNT',       // Actual Spent
    CLAIM_PERIOD: 'ufCrm16_CLAIM_PERIOD',
    CLAIM_STATUS: 'ufCrm16_CLAIM_STATUS',
    PARENT_LOA: 'parentId1050'
};

// Progressive Billing Pipeline
export const PROGRESSIVE_BILLING_PIPELINE_ID = 150;

// Progressive Billing Stages (in order) — 8 construction milestones
// Stage 0 (S&P Successful) is the entry point before milestones begin
export const BILLING_STAGES = {
    SP_SUCCESSFUL: 'C150:NEW',
    SITE_CLEARING: 'C150:PREPARATION',
    PILING_WORK: 'C150:PREPAYMENT_INVOI',
    FOUNDATION_WORK: 'C150:EXECUTING',
    CONCRETE_REINFORCEMENT: 'C150:FINAL_INVOICE',
    ELECTRICAL_PLUMBING: 'C150:UC_ELEC_PLUMB',
    ROOFING: 'C150:UC_ROOFING',
    PLASTERING: 'C150:UC_PLASTERING',
    ROADS_DRAINS: 'C150:UC_ROADS',
    SUCCESS: 'C150:WON',
    LOST: 'C150:LOSE'
};

// Ordered milestone stages with billing percentages (from Schedule of Payment)
// Upon signing SPA = 10% (this is the down payment, already collected before progressive billing)
// Vacant Possession = 5% (collected at handover, after all construction milestones)
export const BILLING_MILESTONE_ORDER = [
    { stageId: 'C150:PREPARATION', percent: 10 },
    { stageId: 'C150:PREPAYMENT_INVOI', percent: 10 },
    { stageId: 'C150:EXECUTING', percent: 10 },
    { stageId: 'C150:FINAL_INVOICE', percent: 15 },
    { stageId: 'C150:UC_ELEC_PLUMB', percent: 15 },
    { stageId: 'C150:UC_ROOFING', percent: 10 },
    { stageId: 'C150:UC_PLASTERING', percent: 10 },
    { stageId: 'C150:UC_ROADS', percent: 5  }
];

export const BILLING_STAGE_LABELS = {
    'C150:NEW': 'S&P Successful',
    'C150:PREPARATION': 'Site Clearing',
    'C150:PREPAYMENT_INVOI': 'Piling Work',
    'C150:EXECUTING': 'Foundation Work',
    'C150:FINAL_INVOICE': 'Concrete Reinforcement',
    'C150:UC_ELEC_PLUMB': 'Electrical Wiring & Plumbing',
    'C150:UC_ROOFING': 'Roofing',
    'C150:UC_PLASTERING': 'Internal & External Plastering',
    'C150:UC_ROADS': 'Roads & Drains',
    'C150:WON': 'Success',
    'C150:LOSE': 'Deal Lost'
};

// Sales Deal Fields for Cashflow
export const SALES_DEAL_FIELDS = {
    BOOKING_FEE: 'UF_CRM_BOOKING_FEE',          // Booking fee amount (double)
    DOWN_PAYMENT: 'UF_CRM_DOWN_PAYMENT'          // Down payment amount (double)
};

// Billing Deal Fields
export const BILLING_DEAL_FIELDS = {
    PARENT_SALES_DEAL: 'UF_CRM_PARENT_SALES_DEAL' // Link to parent Sales & Booking deal (crm type)
};
