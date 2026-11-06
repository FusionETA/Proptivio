#!/usr/bin/env node
/**
 * Fix pipeline stages and add custom fields for Proptivio
 */

const WEBHOOK_URL = 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/';
const PIPELINES = { SALES: 148, BILLING: 150, CONSTRUCTION: 152 };

function log(msg) { console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`); }

async function bxPost(method, body = {}) {
    const res = await fetch(WEBHOOK_URL + method, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.error && data.error_description) throw new Error(`${method}: ${data.error_description}`);
    return data.result;
}

async function listStages(catId) {
    return bxPost('crm.status.list', { filter: { ENTITY_ID: `DEAL_STAGE_${catId}` } });
}

async function renameStage(id, name, color, sort) {
    return bxPost('crm.status.update', { id, fields: { NAME: name, COLOR: color, SORT: sort } });
}

async function addStage(catId, name, sort, color) {
    const result = await bxPost('crm.status.add', {
        fields: { ENTITY_ID: `DEAL_STAGE_${catId}`, NAME: name, SORT: sort, COLOR: color }
    });
    return result;
}

async function deleteStage(id) {
    try { return await bxPost('crm.status.delete', { id }); } catch (e) { /* system stages can't be deleted */ }
}

// ============================================================
// Fix Sales & Booking Pipeline (148)
// ============================================================
async function fixSalesPipeline() {
    log(`\nFixing Sales & Booking pipeline (C${PIPELINES.SALES})...`);
    const stages = await listStages(PIPELINES.SALES);
    log(`  Found ${stages.length} existing stages`);

    // Map existing stage IDs to our desired names
    const renames = [
        { statusId: 'C148:NEW',              name: 'New Booking',          color: '8B5CF6', sort: 10 },
        { statusId: 'C148:PREPARATION',      name: 'OTP Issued',           color: '3B82F6', sort: 20 },
        { statusId: 'C148:PREPAYMENT_INVOI', name: 'Deposit Verification', color: 'F59E0B', sort: 30 },
        { statusId: 'C148:EXECUTING',        name: 'Loan Application',     color: 'F97316', sort: 40 },
        { statusId: 'C148:FINAL_INVOICE',    name: 'SPA Preparation',      color: '06B6D4', sort: 50 },
    ];

    const stageMap = {};
    stages.forEach(s => stageMap[s.STATUS_ID] = s.ID);

    for (const r of renames) {
        if (stageMap[r.statusId]) {
            await renameStage(stageMap[r.statusId], r.name, r.color, r.sort);
            log(`  ✓ Renamed ${r.statusId} → "${r.name}"`);
        }
    }

    // Delete APOLOGY stage
    if (stageMap['C148:APOLOGY']) {
        await deleteStage(stageMap['C148:APOLOGY']);
        log(`  ✓ Deleted APOLOGY stage`);
    }

    // Add missing stages (SPA Stamping, Foreign Approval)
    await addStage(PIPELINES.SALES, 'SPA Stamping',      60, '0EA5E9');
    log(`  ✓ Added "SPA Stamping"`);
    await addStage(PIPELINES.SALES, 'Foreign Approval',  70, '8B5CF6');
    log(`  ✓ Added "Foreign Approval"`);

    // List final stages for constants.js
    const finalStages = await listStages(PIPELINES.SALES);
    log('  Final Sales pipeline stages:');
    finalStages.forEach(s => log(`    ${s.STATUS_ID} | ${s.NAME}`));
    return finalStages;
}

// ============================================================
// Fix Progressive Billing Pipeline (150)
// ============================================================
async function fixBillingPipeline() {
    log(`\nFixing Progressive Billing pipeline (C${PIPELINES.BILLING})...`);
    const stages = await listStages(PIPELINES.BILLING);
    const stageMap = {};
    stages.forEach(s => stageMap[s.STATUS_ID] = s.ID);

    const renames = [
        { statusId: 'C150:NEW',              name: 'S&P Successful',                color: '166534', sort: 10 },
        { statusId: 'C150:PREPARATION',      name: 'Site Clearing',                 color: '15803D', sort: 20 },
        { statusId: 'C150:PREPAYMENT_INVOI', name: 'Piling Work',                   color: '16A34A', sort: 30 },
        { statusId: 'C150:EXECUTING',        name: 'Foundation Work',               color: '22C55E', sort: 40 },
        { statusId: 'C150:FINAL_INVOICE',    name: 'Concrete Reinforcement',        color: '0D9488', sort: 50 },
    ];

    for (const r of renames) {
        if (stageMap[r.statusId]) {
            await renameStage(stageMap[r.statusId], r.name, r.color, r.sort);
            log(`  ✓ Renamed ${r.statusId} → "${r.name}"`);
        }
    }

    if (stageMap['C150:APOLOGY']) { await deleteStage(stageMap['C150:APOLOGY']); }

    await addStage(PIPELINES.BILLING, 'Electrical Wiring & Plumbing',    60, '0891B2');
    await addStage(PIPELINES.BILLING, 'Roofing',                          70, '2563EB');
    await addStage(PIPELINES.BILLING, 'Internal & External Plastering',  80, '7C3AED');
    await addStage(PIPELINES.BILLING, 'Roads & Drains',                   90, '9333EA');
    log(`  ✓ Added 4 additional billing stages`);

    const finalStages = await listStages(PIPELINES.BILLING);
    log('  Final Billing pipeline stages:');
    finalStages.forEach(s => log(`    ${s.STATUS_ID} | ${s.NAME}`));
    return finalStages;
}

// ============================================================
// Fix Construction Cost Pipeline (152)
// ============================================================
async function fixConstructionPipeline() {
    log(`\nFixing Construction Cost pipeline (C${PIPELINES.CONSTRUCTION})...`);
    const stages = await listStages(PIPELINES.CONSTRUCTION);
    const stageMap = {};
    stages.forEach(s => stageMap[s.STATUS_ID] = s.ID);

    const renames = [
        { statusId: 'C152:NEW',              name: 'Site Clearing',                 color: '78350F', sort: 10 },
        { statusId: 'C152:PREPARATION',      name: 'Piling Work',                   color: '92400E', sort: 20 },
        { statusId: 'C152:PREPAYMENT_INVOI', name: 'Foundation Work',               color: 'B45309', sort: 30 },
        { statusId: 'C152:EXECUTING',        name: 'Concrete Reinforcement',        color: 'D97706', sort: 40 },
        { statusId: 'C152:FINAL_INVOICE',    name: 'Electrical Wiring & Plumbing',  color: 'F59E0B', sort: 50 },
    ];

    for (const r of renames) {
        if (stageMap[r.statusId]) {
            await renameStage(stageMap[r.statusId], r.name, r.color, r.sort);
            log(`  ✓ Renamed ${r.statusId} → "${r.name}"`);
        }
    }

    if (stageMap['C152:APOLOGY']) { await deleteStage(stageMap['C152:APOLOGY']); }

    await addStage(PIPELINES.CONSTRUCTION, 'Roofing',                          60, 'FCD34D');
    await addStage(PIPELINES.CONSTRUCTION, 'Internal & External Plastering',  70, 'FDE68A');
    await addStage(PIPELINES.CONSTRUCTION, 'Roads & Drains',                   80, 'FEF3C7');
    await addStage(PIPELINES.CONSTRUCTION, 'Vacant Possession',                90, 'ECFDF5');
    log(`  ✓ Added 4 additional construction stages`);

    const finalStages = await listStages(PIPELINES.CONSTRUCTION);
    log('  Final Construction pipeline stages:');
    finalStages.forEach(s => log(`    ${s.STATUS_ID} | ${s.NAME}`));
    return finalStages;
}

// ============================================================
// Add Custom Fields (use crm.userfield.add)
// ============================================================
async function addCustomFields(spas) {
    log('\nAdding custom fields...');
    const output = { loa: {}, vo: {}, claims: {}, sales: {}, billing: {} };

    async function addField(entityId, fieldName, label, typeId, extraProps = {}) {
        try {
            const result = await bxPost('crm.userfield.add', {
                fields: {
                    ENTITY_ID: entityId, FIELD_NAME: fieldName,
                    EDIT_FORM_LABEL: label, USER_TYPE_ID: typeId,
                    MULTIPLE: 'N', MANDATORY: 'N', SHOW_FILTER: 'Y',
                    ...extraProps
                }
            });
            log(`  ✓ ${entityId}.${fieldName}: ID ${result}`);
            return result;
        } catch (e) {
            log(`  ✗ ${entityId}.${fieldName}: ${e.message}`);
            return null;
        }
    }

    // LOA fields (use CRM_<entityTypeId> format)
    if (spas.loa) {
        const eid = `CRM_${spas.loa}`;
        output.loa.LOA_NUMBER     = await addField(eid, 'LOA_NUMBER',     'LOA Number',          'string');
        output.loa.LOA_DATE       = await addField(eid, 'LOA_DATE',       'LOA Date',            'date');
        output.loa.MILESTONE_NAME = await addField(eid, 'MILESTONE_NAME', 'Construction Milestone', 'string');
    }

    // VO fields
    if (spas.vo) {
        const eid = `CRM_${spas.vo}`;
        output.vo.VO_NUMBER      = await addField(eid, 'VO_NUMBER',      'VO Number',      'string');
        output.vo.VO_DESCRIPTION = await addField(eid, 'VO_DESCRIPTION', 'VO Description', 'string');
        output.vo.VO_TYPE        = await addField(eid, 'VO_TYPE',        'VO Type',        'enumeration', {
            LIST: [{ VALUE: 'Add', SORT: 10 }, { VALUE: 'Omit', SORT: 20 }]
        });
    }

    // Claims fields
    if (spas.claims) {
        const eid = `CRM_${spas.claims}`;
        output.claims.CLAIM_AMOUNT = await addField(eid, 'CLAIM_AMOUNT', 'Claim Amount', 'money');
        output.claims.CLAIM_PERIOD = await addField(eid, 'CLAIM_PERIOD', 'Claim Period', 'string');
        output.claims.CLAIM_STATUS = await addField(eid, 'CLAIM_STATUS', 'Claim Status', 'enumeration', {
            LIST: [{ VALUE: 'Pending', SORT: 10 }, { VALUE: 'Approved', SORT: 20 }, { VALUE: 'Paid', SORT: 30 }]
        });
    }

    // Sales deal custom fields
    output.sales.BOOKING_FEE     = await addField('CRM_DEAL', 'BOOKING_FEE',       'Booking Fee',    'double');
    output.sales.DOWN_PAYMENT    = await addField('CRM_DEAL', 'DOWN_PAYMENT',      'Down Payment',   'money');
    output.billing.PARENT_DEAL   = await addField('CRM_DEAL', 'PARENT_SALES_DEAL', 'Parent Sales Deal', 'crm');

    return output;
}

// ============================================================
// Update constants.js with real stage IDs
// ============================================================
async function updateConstantsWithStages(salesStages, billingStages, constructionStages, fields) {
    log('\nUpdating constants.js with real stage IDs...');

    const { readFileSync, writeFileSync } = await import('fs');
    const { resolve, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const __dir = dirname(fileURLToPath(import.meta.url));
    const constantsPath = resolve(__dir, '../management-dashboard/src/lib/constants.js');

    let content = readFileSync(constantsPath, 'utf8');

    // Build stage lookup by name
    const salesByName = {};
    salesStages.forEach(s => { salesByName[s.NAME] = s.STATUS_ID; });

    const billingByName = {};
    billingStages.forEach(s => { billingByName[s.NAME] = s.STATUS_ID; });

    // Update SALES_STAGES in constants.js
    const newBookingId   = salesByName['New Booking']          || 'C148:NEW';
    const otpIssuedId    = salesByName['OTP Issued']           || 'C148:PREPARATION';
    const depositVerId   = salesByName['Deposit Verification'] || 'C148:PREPAYMENT_INVOI';
    const loanAppId      = salesByName['Loan Application']     || 'C148:EXECUTING';
    const spaPrepId      = salesByName['SPA Preparation']      || 'C148:FINAL_INVOICE';
    const spaStampId     = salesByName['SPA Stamping']         || 'C148:UC_SPA_STAMP';
    const foreignAppId   = salesByName['Foreign Approval']     || 'C148:UC_FOREIGN';

    // Replace SALES_STAGES block
    const newSalesStages = `export const SALES_STAGES = {
    NEW_BOOKING: '${newBookingId}',
    OTP_ISSUED: '${otpIssuedId}',
    DEPOSIT_VERIFICATION: '${depositVerId}',
    LOAN_APPLICATION: '${loanAppId}',
    SPA_PREPARATION: '${spaPrepId}',
    SPA_STAMPING: '${spaStampId}',
    FOREIGN_APPROVAL: '${foreignAppId}',
    COMPLETED: 'C148:WON',
    CANCELLED: 'C148:LOSE'
};`;
    content = content.replace(/export const SALES_STAGES = \{[\s\S]*?\};/, newSalesStages);

    // Update STAGE_ORDER
    const newStageOrder = `export const STAGE_ORDER = [
    '${newBookingId}',
    '${otpIssuedId}',
    '${depositVerId}',
    '${loanAppId}',
    '${spaPrepId}',
    '${spaStampId}',
    '${foreignAppId}',
    'C148:WON'
];`;
    content = content.replace(/export const STAGE_ORDER = \[[\s\S]*?\];/, newStageOrder);

    // Update SOLD_DEFINITIONS
    const newSoldDefs = `export const SOLD_DEFINITIONS = {
    BOOKING_PAID: ['${depositVerId}', '${loanAppId}', '${spaPrepId}', '${spaStampId}', '${foreignAppId}', 'C148:WON'],
    BANK_LOAN_APPROVED: ['${spaPrepId}', '${spaStampId}', '${foreignAppId}', 'C148:WON'],
    SPA_COMPLETED: ['C148:WON']
};`;
    content = content.replace(/export const SOLD_DEFINITIONS = \{[\s\S]*?\};/, newSoldDefs);

    // Update BOOKING_EXCLUDED_STAGES
    content = content.replace(/export const BOOKING_EXCLUDED_STAGES = \[[\s\S]*?\];/,
        `export const BOOKING_EXCLUDED_STAGES = [\n    'C148:LOSE'\n];`);

    // Update BILLING_STAGES
    const sp   = billingByName['S&P Successful']               || 'C150:NEW';
    const sc   = billingByName['Site Clearing']                || 'C150:PREPARATION';
    const pw   = billingByName['Piling Work']                  || 'C150:PREPAYMENT_INVOI';
    const fw   = billingByName['Foundation Work']              || 'C150:EXECUTING';
    const cr   = billingByName['Concrete Reinforcement']       || 'C150:FINAL_INVOICE';
    const ep   = billingByName['Electrical Wiring & Plumbing'] || 'C150:UC_EP';
    const rf   = billingByName['Roofing']                      || 'C150:UC_RF';
    const pl   = billingByName['Internal & External Plastering'] || 'C150:UC_PL';
    const rd   = billingByName['Roads & Drains']               || 'C150:UC_RD';

    const newBillingStages = `export const BILLING_STAGES = {
    SP_SUCCESSFUL: '${sp}',
    SITE_CLEARING: '${sc}',
    PILING_WORK: '${pw}',
    FOUNDATION_WORK: '${fw}',
    CONCRETE_REINFORCEMENT: '${cr}',
    ELECTRICAL_PLUMBING: '${ep}',
    ROOFING: '${rf}',
    PLASTERING: '${pl}',
    ROADS_DRAINS: '${rd}',
    SUCCESS: 'C150:WON',
    LOST: 'C150:LOSE'
};`;
    content = content.replace(/export const BILLING_STAGES = \{[\s\S]*?\};/, newBillingStages);

    // Update BILLING_MILESTONE_ORDER
    const newMilestoneOrder = `export const BILLING_MILESTONE_ORDER = [
    { stageId: '${sc}', percent: 10 },
    { stageId: '${pw}', percent: 10 },
    { stageId: '${fw}', percent: 10 },
    { stageId: '${cr}', percent: 15 },
    { stageId: '${ep}', percent: 15 },
    { stageId: '${rf}', percent: 10 },
    { stageId: '${pl}', percent: 10 },
    { stageId: '${rd}', percent: 5  }
];`;
    content = content.replace(/export const BILLING_MILESTONE_ORDER = \[[\s\S]*?\];/, newMilestoneOrder);

    // Update BILLING_STAGE_LABELS
    const newStageLabels = `export const BILLING_STAGE_LABELS = {
    '${sp}': 'S&P Successful',
    '${sc}': 'Site Clearing',
    '${pw}': 'Piling Work',
    '${fw}': 'Foundation Work',
    '${cr}': 'Concrete Reinforcement',
    '${ep}': 'Electrical Wiring & Plumbing',
    '${rf}': 'Roofing',
    '${pl}': 'Internal & External Plastering',
    '${rd}': 'Roads & Drains',
    'C150:WON': 'Success',
    'C150:LOSE': 'Deal Lost'
};`;
    content = content.replace(/export const BILLING_STAGE_LABELS = \{[\s\S]*?\};/, newStageLabels);

    // Update custom field IDs if we got them
    if (fields?.sales?.BOOKING_FEE) {
        content = content.replace(/BOOKING_FEE:\s*'[^']*'/,  `BOOKING_FEE: 'UF_CRM_${fields.sales.BOOKING_FEE}'`);
    }
    if (fields?.sales?.DOWN_PAYMENT) {
        content = content.replace(/DOWN_PAYMENT:\s*'[^']*'/, `DOWN_PAYMENT: 'UF_CRM_${fields.sales.DOWN_PAYMENT}'`);
    }
    if (fields?.billing?.PARENT_DEAL) {
        content = content.replace(/PARENT_SALES_DEAL:\s*'[^']*'/, `PARENT_SALES_DEAL: 'UF_CRM_${fields.billing.PARENT_DEAL}'`);
    }

    // Update LOA/VO/Claims field IDs if present
    // (Leave as-is if fields are null — they still need configuration in PMID constants format)

    writeFileSync(constantsPath, content);
    log('  ✓ constants.js fully updated with real stage IDs');
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   Proptivio Stage & Fields Fix       ║');
    console.log('╚══════════════════════════════════════╝\n');

    // Read existing SPA IDs from setup-output.json
    let spas = { loa: 1300, vo: 1304, claims: 1308 };
    try {
        const { readFileSync } = await import('fs');
        const out = JSON.parse(readFileSync('./setup-output.json', 'utf8'));
        spas = out.spas
            ? { loa: out.spas.loaEntityTypeId, vo: out.spas.voEntityTypeId, claims: out.spas.claimsEntityTypeId }
            : spas;
    } catch (e) { log('Using default SPA IDs from prior run'); }

    const salesStages        = await fixSalesPipeline();
    const billingStages      = await fixBillingPipeline();
    const constructionStages = await fixConstructionPipeline();

    const fields = await addCustomFields(spas);

    await updateConstantsWithStages(salesStages, billingStages, constructionStages, fields);

    // Save updated output
    const { readFileSync, writeFileSync } = await import('fs');
    let prev = {};
    try { prev = JSON.parse(readFileSync('./setup-output.json', 'utf8')); } catch (e) {}
    const updated = {
        ...prev,
        stagesFixed: true,
        salesStages: Object.fromEntries(salesStages.map(s => [s.NAME, s.STATUS_ID])),
        billingStages: Object.fromEntries(billingStages.map(s => [s.NAME, s.STATUS_ID])),
        constructionStages: Object.fromEntries(constructionStages.map(s => [s.NAME, s.STATUS_ID])),
        fields
    };
    writeFileSync('./setup-output.json', JSON.stringify(updated, null, 2));

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   ALL DONE — Proptivio is ready!     ║');
    console.log('╚══════════════════════════════════════╝');
    console.log('\n  Run the dashboard:');
    console.log('  cd ../management-dashboard && npm install && npm run dev\n');
}

main().catch(err => { console.error('\n[ERROR]', err.message); process.exit(1); });
