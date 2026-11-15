#!/usr/bin/env node
/**
 * Proptivio Commission SPA Setup Script
 *
 * Creates the Commission Smart Process in fusion.bitrix24.com with:
 *   - 4 categories: Transaction, Rate Setting, Statement Record, Approval
 *   - All custom fields matching PMID's commission portal
 *   - Updates commission-portal/lib/bitrix/config.ts with real IDs
 *   - Creates sample commission records to populate the portal
 *
 * Usage: node setup-commission-spa.js <admin-webhook-url>
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const ADMIN_WEBHOOK = process.argv[2] || 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/';
const OUTPUT_FILE   = join(__dirname, 'commission-output.json');

function log(msg) { console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`); }

async function bxPost(webhook, method, body = {}) {
    const res = await fetch(webhook + method, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error && data.error !== '0') {
        throw new Error(`${method}: ${data.error_description || data.error}`);
    }
    return data.result;
}

async function bxGet(webhook, method, params = {}) {
    const url = new URL(webhook + method);
    function ap(prefix, v) {
        if (v === null || v === undefined) return;
        if (Array.isArray(v)) v.forEach((x,i) => ap(`${prefix}[${i}]`, x));
        else if (typeof v === 'object') Object.entries(v).forEach(([k,x]) => ap(`${prefix}[${k}]`, x));
        else url.searchParams.append(prefix, v);
    }
    Object.entries(params).forEach(([k,v]) => ap(k,v));
    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.error && data.error !== '0') throw new Error(`${method}: ${data.error_description || data.error}`);
    return data.result;
}

// ============================================================
// STEP 1: Verify access
// ============================================================
async function verifyAccess() {
    log('Verifying webhook access...');
    const profile = await bxGet(ADMIN_WEBHOOK, 'profile');
    log(`  Connected as: ${profile.NAME} ${profile.LAST_NAME} (ID: ${profile.ID})`);
    return profile;
}

// ============================================================
// STEP 2: Create Commission SPA
// ============================================================
async function createCommissionSPA() {
    log('Creating Commission Smart Process (SPA)...');

    const result = await bxPost(ADMIN_WEBHOOK, 'crm.type.add', {
        fields: {
            title: 'Commission',
            isUseInUserfieldEnabled: true,
            isCrmTrackingEnabled: false,
            isObserversEnabled: true,
            isMycompanyEnabled: false,
            isContactEnabled: false,
            isCompanyEnabled: false,
            isStagesEnabled: true,
            isBeginCloseDatesEnabled: true,
            isClientEnabled: false,
            isLinkWithProductsInDealsEnabled: false,
        }
    });

    const entityTypeId = result?.type?.entityTypeId;
    if (!entityTypeId) throw new Error(`Failed to get entityTypeId. Got: ${JSON.stringify(result)}`);
    log(`  ✓ Commission SPA created: entityTypeId ${entityTypeId}`);
    return entityTypeId;
}

// ============================================================
// STEP 3: Create SPA Categories
// ============================================================
async function createCategories(entityTypeId) {
    log('Creating Commission SPA categories...');
    const categories = {};

    const defs = [
        { name: 'Transaction',       sort: 10 },
        { name: 'Rate Setting',      sort: 20 },
        { name: 'Statement Record',  sort: 30 },
        { name: 'Approval',          sort: 40 },
    ];

    for (const def of defs) {
        try {
            const result = await bxPost(ADMIN_WEBHOOK, 'crm.category.add', {
                entityTypeId,
                fields: { name: def.name, sort: def.sort, isDefault: false },
            });
            const catId = result?.category?.id ?? result?.id ?? result;
            categories[def.name] = catId;
            log(`  ✓ Category "${def.name}": ID ${catId}`);
        } catch (e) {
            log(`  ✗ Category "${def.name}": ${e.message}`);
        }
    }

    return categories;
}

// ============================================================
// STEP 4: Create Custom Fields
// ============================================================
async function createFields(entityTypeId) {
    log('Creating custom fields for Commission SPA...');
    const entityId = `CRM_${entityTypeId}`;
    const results  = {};

    const fieldDefs = [
        { key: 'PROCESS_DATE',               label: 'Process Date',              type: 'date'         },
        { key: 'TRANSACTION_DATE',           label: 'Transaction Date',          type: 'date'         },
        { key: 'ACCOUNT_NO',                 label: 'Account No',                type: 'string'       },
        { key: 'BUYER_NAME',                 label: 'Buyer Name',                type: 'string'       },
        { key: 'PROJECT_DEVELOPER',          label: 'Project/Developer',         type: 'string'       },
        { key: 'TRANSACTION_AMOUNT',         label: 'Transaction Amount',        type: 'money'        },
        { key: 'COMMISSION_RATE',            label: 'Commission Rate (%)',       type: 'double'       },
        { key: 'COMMISSION_AMOUNT',          label: 'Commission Amount',         type: 'money'        },
        { key: 'DEVELOPER_RATE',             label: 'Developer Rate (%)',        type: 'double'       },
        { key: 'DEVELOPER_INCOME',           label: 'Developer Income',          type: 'money'        },
        { key: 'DEVELOPER_PAYABLE_INCOME',   label: 'Developer Payable Income',  type: 'money'        },
        { key: 'AGENT_RATE',                 label: 'Agent Rate (%)',            type: 'double'       },
        { key: 'AGENT_INCOME',               label: 'Agent Income',              type: 'money'        },
        { key: 'AGENT_PAYABLE_INCOME',       label: 'Agent Payable Income',      type: 'money'        },
        { key: 'DEAL_ID',                    label: 'Related Deal ID',           type: 'string'       },
        { key: 'TRANSACTION_RECORD_PARENT',  label: 'Transaction Record Parent', type: 'string'       },
        { key: 'ERROR_MESSAGE',              label: 'Error Message',             type: 'string'       },
        { key: 'INCOME',                     label: 'Statement Income',          type: 'money'        },
        { key: 'APPROVAL_STATUS',            label: 'Approval Status',           type: 'enumeration' },
        { key: 'STATEMENT_RECORD_CHILD',     label: 'Statement Record Child',    type: 'string'       },
    ];

    for (const { key, label, type } of fieldDefs) {
        try {
            const fieldBody = {
                moduleId: 'crm',
                field: {
                    ENTITY_ID: entityId,
                    FIELD_NAME: key,
                    EDIT_FORM_LABEL: label,
                    USER_TYPE_ID: type,
                    MULTIPLE: 'N',
                    MANDATORY: 'N',
                    SHOW_FILTER: 'Y',
                    SHOW_IN_LIST: 'Y',
                    EDIT_IN_LIST: 'Y',
                },
            };
            if (type === 'enumeration') {
                fieldBody.field.LIST = [
                    { VALUE: 'PENDING',  SORT: 10 },
                    { VALUE: 'APPROVED', SORT: 20 },
                    { VALUE: 'REJECTED', SORT: 30 },
                ];
            }
            const res = await bxPost(ADMIN_WEBHOOK, 'userfieldconfig.add', fieldBody);
            const id  = res?.field?.id ?? res?.id ?? res;
            results[key] = { id };
            log(`  ✓ ${key}: created (id ${id})`);
        } catch (e) {
            log(`  ✗ ${key}: ${e.message}`);
            results[key] = { id: null };
        }
    }

    return results;
}

// ============================================================
// STEP 5: Fetch actual Bitrix24 field names
// ============================================================
async function fetchFieldNames(entityTypeId) {
    log('Fetching actual field names from Bitrix24...');
    const entityId = `CRM_${entityTypeId}`;

    let all = [];
    let start = 0;
    while (true) {
        const res = await bxPost(ADMIN_WEBHOOK, 'userfieldconfig.list', {
            moduleId: 'crm',
            filter: { ENTITY_ID: entityId },
            start,
        });
        const batch = res?.fields ?? (Array.isArray(res) ? res : []);
        all = all.concat(batch);
        if (batch.length < 50) break;
        start += 50;
    }

    const nameMap = {};
    for (const f of all) {
        const rawName = f.FIELD_NAME || f.fieldName || '';
        const prefix  = `UF_CRM_${entityTypeId}_`;
        if (rawName.startsWith(prefix)) {
            const suffix = rawName.slice(prefix.length);
            nameMap[suffix] = rawName;
        }
    }
    log(`  Found ${Object.keys(nameMap).length} UF fields for entity ${entityTypeId}`);
    if (Object.keys(nameMap).length < 5) {
        log(`  DEBUG: raw fields returned: ${JSON.stringify(all.slice(0,3))}`);
    }
    return nameMap;
}

// ============================================================
// STEP 6: Create sample commission records
// ============================================================
async function createSampleData(entityTypeId, categories) {
    log('Creating sample commission records...');

    const catId = categories['Transaction'];
    if (!catId) { log('  ✗ No Transaction category, skipping sample data'); return 0; }

    const samples = [
        { title: 'Commission - Ahmad Firdaus - Unit A-12-01',  categoryId: catId },
        { title: 'Commission - Nurul Ain - Unit B-05-03',      categoryId: catId },
        { title: 'Commission - Tan Wei Ming - Unit C-08-12',   categoryId: catId },
    ];

    let created = 0;
    for (const fields of samples) {
        try {
            await bxPost(ADMIN_WEBHOOK, 'crm.item.add', { entityTypeId, fields });
            created++;
            log(`  ✓ ${fields.title}`);
        } catch (e) {
            log(`  ✗ "${fields.title}": ${e.message}`);
        }
    }

    return created;
}

// ============================================================
// STEP 7: Update config files with real IDs
// ============================================================
async function updateConfig(entityTypeId, categories, fieldNameMap) {
    log('Updating commission config files...');

    function ufVal(key) {
        if (fieldNameMap[key]) return fieldNameMap[key];
        return `UF_CRM_${entityTypeId}_${key}`;
    }

    const configContent = `// Bitrix24 Configuration for Proptivio Commission SPA
// AUTO-GENERATED by setup-commission-spa.js on ${new Date().toISOString()}
export const BITRIX_CONFIG = {
    WEBHOOK_URL: 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/',
    ENTITY_TYPE_ID: ${entityTypeId},
    CATEGORIES: {
        TRANSACTION: ${categories['Transaction'] ?? 'TODO_REPLACE'},
        STATEMENT_RECORD: ${categories['Statement Record'] ?? 'TODO_REPLACE'},
        APPROVAL: ${categories['Approval'] ?? 'TODO_REPLACE'},
    },
} as const;

export const BITRIX_FIELDS = {
    ID: 'id',
    TITLE: 'title',
    ASSIGNED_BY_ID: 'assignedById',
    CREATED_TIME: 'createdTime',
    UPDATED_TIME: 'updatedTime',
    PROCESS_DATE: '${ufVal('PROCESS_DATE')}',
    TRANSACTION_DATE: '${ufVal('TRANSACTION_DATE')}',
    ACCOUNT_NO: '${ufVal('ACCOUNT_NO')}',
    BUYER_NAME: '${ufVal('BUYER_NAME')}',
    PROJECT_DEVELOPER: '${ufVal('PROJECT_DEVELOPER')}',
    TRANSACTION_AMOUNT: '${ufVal('TRANSACTION_AMOUNT')}',
    COMMISSION_RATE: '${ufVal('COMMISSION_RATE')}',
    COMMISSION_AMOUNT: '${ufVal('COMMISSION_AMOUNT')}',
    DEVELOPER_RATE: '${ufVal('DEVELOPER_RATE')}',
    DEVELOPER_INCOME: '${ufVal('DEVELOPER_INCOME')}',
    DEVELOPER_PAYABLE_INCOME: '${ufVal('DEVELOPER_PAYABLE_INCOME')}',
    AGENT_RATE: '${ufVal('AGENT_RATE')}',
    AGENT_INCOME: '${ufVal('AGENT_INCOME')}',
    AGENT_PAYABLE_INCOME: '${ufVal('AGENT_PAYABLE_INCOME')}',
    DEAL_ID: '${ufVal('DEAL_ID')}',
    TRANSACTION_RECORD_PARENT: '${ufVal('TRANSACTION_RECORD_PARENT')}',
    ERROR_MESSAGE: '${ufVal('ERROR_MESSAGE')}',
    INCOME: '${ufVal('INCOME')}',
    APPROVAL_STATUS: '${ufVal('APPROVAL_STATUS')}',
    STATEMENT_RECORD_CHILD: '${ufVal('STATEMENT_RECORD_CHILD')}',
} as const;
`;

    const commissionConfigContent = `// Commission Trigger Configuration
// AUTO-GENERATED by setup-commission-spa.js on ${new Date().toISOString()}
export const COMMISSION_CONFIG = {
    PIPELINE_ID: 150,
    WEBHOOK_URL: 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/',
    COMMISSION_ENTITY_TYPE_ID: ${entityTypeId},
    STAGES: {
        'C150:PREPARATION': {
            name: 'Site Clearing', rate: 0.02, stageNumber: 1,
            description: 'First stage commission - Site Clearing',
        },
        'C150:PREPAYMENT_INVOI': {
            name: 'Piling Work', rate: 0.01, stageNumber: 2,
            description: 'Second stage commission - Piling Work',
        },
        'C150:EXECUTING': {
            name: 'Concrete Reinforcement', rate: 0.02, stageNumber: 3,
            description: 'Third stage commission - Concrete Reinforcement',
        },
    },
    CATEGORIES: {
        TRANSACTION: ${categories['Transaction'] ?? 'TODO_REPLACE'},
        RATE_SETTING: ${categories['Rate Setting'] ?? 'TODO_REPLACE'},
        STATEMENT_RECORD: ${categories['Statement Record'] ?? 'TODO_REPLACE'},
        APPROVAL: ${categories['Approval'] ?? 'TODO_REPLACE'},
    },
} as const;

export const COMMISSION_FIELDS = {
    ID: 'id',
    TITLE: 'title',
    CATEGORY_ID: 'categoryId',
    ASSIGNED_BY_ID: 'assignedById',
    PROCESS_DATE: '${ufVal('PROCESS_DATE')}',
    TRANSACTION_DATE: '${ufVal('TRANSACTION_DATE')}',
    ACCOUNT_NO: '${ufVal('ACCOUNT_NO')}',
    BUYER_NAME: '${ufVal('BUYER_NAME')}',
    PROJECT_DEVELOPER: '${ufVal('PROJECT_DEVELOPER')}',
    TRANSACTION_AMOUNT: '${ufVal('TRANSACTION_AMOUNT')}',
    COMMISSION_RATE: '${ufVal('COMMISSION_RATE')}',
    COMMISSION_AMOUNT: '${ufVal('COMMISSION_AMOUNT')}',
    DEVELOPER_RATE: '${ufVal('DEVELOPER_RATE')}',
    DEVELOPER_INCOME: '${ufVal('DEVELOPER_INCOME')}',
    DEVELOPER_PAYABLE_INCOME: '${ufVal('DEVELOPER_PAYABLE_INCOME')}',
    AGENT_RATE: '${ufVal('AGENT_RATE')}',
    AGENT_INCOME: '${ufVal('AGENT_INCOME')}',
    AGENT_PAYABLE_INCOME: '${ufVal('AGENT_PAYABLE_INCOME')}',
    DEAL_ID: '${ufVal('DEAL_ID')}',
    TRANSACTION_RECORD_PARENT: '${ufVal('TRANSACTION_RECORD_PARENT')}',
    ERROR_MESSAGE: '${ufVal('ERROR_MESSAGE')}',
    APPROVAL_STATUS: '${ufVal('APPROVAL_STATUS')}',
    INCOME: '${ufVal('INCOME')}',
    STATEMENT_RECORD_CHILD: '${ufVal('STATEMENT_RECORD_CHILD')}',
} as const;

export type CommissionStage = { name: string; rate: number; stageNumber: number; description: string };
export interface DealStageChangeEvent {
    dealId: number; stageId: string; categoryId: number; opportunity: number;
    title?: string; contactId?: number; companyId?: number; assignedById?: number;
}
export interface CommissionRecord {
    dealId: number; stageId: string; stageName: string; stageNumber: number;
    transactionAmount: number; commissionRate: number; commissionAmount: number;
    transactionDate: string; buyerName?: string; projectName?: string;
    developerRate?: number; developerIncome?: number; agentRate?: number; agentIncome?: number;
}
export interface RateSetting {
    id: number; title: string; developerRate: number; agentRate: number; commissionRate?: number;
}
`;

    const configPath = join(__dirname, '..', 'commission-portal', 'commission-portal', 'lib', 'bitrix', 'config.ts');
    const commPath   = join(__dirname, '..', 'commission-portal', 'commission-portal', 'lib', 'bitrix', 'commission-config.ts');

    writeFileSync(configPath, configContent, 'utf8');
    writeFileSync(commPath, commissionConfigContent, 'utf8');

    log(`  ✓ ${configPath}`);
    log(`  ✓ ${commPath}`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log('\n============================================================');
    console.log('  Proptivio Commission SPA Setup');
    console.log(`  Webhook: ${ADMIN_WEBHOOK.replace(/\/rest\/.*/, '/rest/***')}`);
    console.log('============================================================\n');

    const output = {};

    try {
        await verifyAccess();
        output.entityTypeId = await createCommissionSPA();
        output.categories   = await createCategories(output.entityTypeId);
        output.fields       = await createFields(output.entityTypeId);
        output.fieldNames   = await fetchFieldNames(output.entityTypeId);
        output.sampleCount  = await createSampleData(output.entityTypeId, output.categories);
        await updateConfig(output.entityTypeId, output.categories, output.fieldNames);

        output.success = true;
        writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

        console.log('\n============================================================');
        console.log('  ✓ Commission SPA Setup Complete!');
        console.log('============================================================');
        console.log(`  Entity Type ID : ${output.entityTypeId}`);
        console.log(`  Categories     : ${JSON.stringify(output.categories)}`);
        console.log(`  Fields found   : ${Object.keys(output.fieldNames).length}`);
        console.log(`  Sample records : ${output.sampleCount}`);
        console.log('\n  Next: rebuild commission portal and pm2 restart proptivio-commission');
        console.log('============================================================\n');

    } catch (e) {
        console.error('\n✗ Error:', e.message);
        output.success = false;
        output.error   = e.message;
        writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
        process.exit(1);
    }
}

main();
