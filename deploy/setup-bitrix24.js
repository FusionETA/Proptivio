#!/usr/bin/env node
/**
 * Proptivio Bitrix24 Deployment Script
 * Sets up deal pipelines, smart processes, product catalog, and sample data
 *
 * REQUIRES: Bitrix24 admin webhook URL
 * The default webhook (user 152) has read-only CRM access.
 * Use an admin user's webhook or update Bitrix24 CRM permissions for user 152.
 *
 * HOW TO GET AN ADMIN WEBHOOK:
 * 1. Log into fusion.bitrix24.com as an administrator
 * 2. Go to: Left Menu → Developer Resources → Other → Inbound webhooks
 * 3. Click "Add webhook"
 * 4. Enable ALL permissions, especially CRM
 * 5. Copy the webhook URL and pass it as: node setup-bitrix24.js <webhook-url>
 */

const DEFAULT_WEBHOOK = 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/';
const WEBHOOK_URL = process.argv[2] || DEFAULT_WEBHOOK;

function log(msg) { console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`); }

async function bxCall(method, params = {}) {
    const url = new URL(WEBHOOK_URL + method);
    function appendParam(prefix, value) {
        if (value === null || value === undefined) return;
        if (Array.isArray(value)) {
            value.forEach((v, i) => appendParam(`${prefix}[${i}]`, v));
        } else if (typeof value === 'object') {
            Object.entries(value).forEach(([k, v]) => appendParam(`${prefix}[${k}]`, v));
        } else {
            url.searchParams.append(prefix, value);
        }
    }
    Object.entries(params).forEach(([k, v]) => appendParam(k, v));
    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.error || data.error_description === 'Access denied.') {
        throw new Error(`${method}: ${data.error_description || data.error || 'Access denied'}`);
    }
    return data.result;
}

async function bxPost(method, body = {}) {
    const res = await fetch(WEBHOOK_URL + method, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.error || data.error_description === 'Access denied.') {
        throw new Error(`${method}: ${data.error_description || data.error || 'Access denied'}`);
    }
    return data.result;
}

// ============================================================
// STEP 1: Verify Access
// ============================================================
async function verifyAccess() {
    log('Verifying webhook access...');
    const profile = await bxCall('profile');
    log(`  Connected as: ${profile.NAME} ${profile.LAST_NAME} (ID: ${profile.ID})`);

    // Test write access with a quick check
    try {
        // Try a lightweight write-check
        await bxCall('crm.dealcategory.list');
        log('  CRM read access: OK');
    } catch (e) {
        throw new Error('Cannot access CRM. Check webhook permissions.');
    }
    return profile;
}

// ============================================================
// STEP 2: Create Deal Pipelines
// ============================================================
async function createPipelines() {
    log('Creating deal pipelines...');
    const results = {};

    // Pipeline 1: Sales & Booking
    try {
        const id = await bxPost('crm.dealcategory.add', {
            fields: { NAME: 'Sales & Booking', IS_LOCKED: 'N', SORT: 100 }
        });
        results.salesCatId = id;
        log(`  ✓ Sales & Booking pipeline: ID ${id}`);

        // Add Sales stages via crm.status.add
        const salesStages = [
            { NAME: 'New Booking',          SORT: 10, COLOR: '8B5CF6' },
            { NAME: 'OTP Issued',           SORT: 20, COLOR: '3B82F6' },
            { NAME: 'Deposit Verification', SORT: 30, COLOR: 'F59E0B' },
            { NAME: 'Loan Application',     SORT: 40, COLOR: 'F97316' },
            { NAME: 'SPA Preparation',      SORT: 50, COLOR: '06B6D4' },
            { NAME: 'SPA Stamping',         SORT: 60, COLOR: '0EA5E9' },
            { NAME: 'Foreign Approval',     SORT: 70, COLOR: '8B5CF6' },
        ];
        const salesStageIds = {};
        for (const s of salesStages) {
            try {
                const sid = await bxPost('crm.status.add', {
                    fields: { NAME: s.NAME, SORT: s.SORT, COLOR: s.COLOR, ENTITY_ID: `DEAL_STAGE_C${id}` }
                });
                salesStageIds[s.NAME] = sid;
                log(`    Stage "${s.NAME}": ${sid}`);
            } catch (e) { log(`    Stage "${s.NAME}" error: ${e.message}`); }
        }
        results.salesStageIds = salesStageIds;

        // Get the actual stage codes for constants.js
        try {
            const stages = await bxCall('crm.dealcategory.stages', { id });
            results.salesStages = stages;
            log(`  Sales pipeline has ${Array.isArray(stages) ? stages.length : Object.keys(stages).length} stages total`);
        } catch (e) { log(`  Could not list stages: ${e.message}`); }

    } catch (e) {
        log(`  ✗ Sales & Booking pipeline error: ${e.message}`);
        log('    → Webhook needs admin CRM access. See instructions at top of file.');
        results.salesCatId = null;
    }

    // Pipeline 2: Progressive Billing
    try {
        const id = await bxPost('crm.dealcategory.add', {
            fields: { NAME: 'Progressive Billing', IS_LOCKED: 'N', SORT: 200 }
        });
        results.billingCatId = id;
        log(`  ✓ Progressive Billing pipeline: ID ${id}`);

        const billingStages = [
            { NAME: 'S&P Successful',                 SORT: 10,  COLOR: '166534', percent: 0  },
            { NAME: 'Site Clearing',                   SORT: 20,  COLOR: '15803D', percent: 10 },
            { NAME: 'Piling Work',                     SORT: 30,  COLOR: '16A34A', percent: 10 },
            { NAME: 'Foundation Work',                 SORT: 40,  COLOR: '22C55E', percent: 10 },
            { NAME: 'Concrete Reinforcement',          SORT: 50,  COLOR: '0D9488', percent: 15 },
            { NAME: 'Electrical Wiring & Plumbing',    SORT: 60,  COLOR: '0891B2', percent: 15 },
            { NAME: 'Roofing',                         SORT: 70,  COLOR: '2563EB', percent: 10 },
            { NAME: 'Internal & External Plastering',  SORT: 80,  COLOR: '7C3AED', percent: 10 },
            { NAME: 'Roads & Drains',                  SORT: 90,  COLOR: '9333EA', percent: 5  },
        ];
        results.billingStagePercents = Object.fromEntries(billingStages.map(s => [s.NAME, s.percent]));

        for (const s of billingStages) {
            try {
                await bxPost('crm.status.add', {
                    fields: { NAME: s.NAME, SORT: s.SORT, COLOR: s.COLOR, ENTITY_ID: `DEAL_STAGE_C${id}` }
                });
                log(`    Stage "${s.NAME}"`);
            } catch (e) { log(`    Stage "${s.NAME}" error: ${e.message}`); }
        }

        // List actual stages with IDs
        try {
            const stages = await bxCall('crm.dealcategory.stages', { id });
            results.billingStages = stages;
        } catch (e) { }

    } catch (e) {
        log(`  ✗ Progressive Billing pipeline error: ${e.message}`);
        results.billingCatId = null;
    }

    // Pipeline 3: Construction Cost
    try {
        const id = await bxPost('crm.dealcategory.add', {
            fields: { NAME: 'Construction Cost', IS_LOCKED: 'N', SORT: 300 }
        });
        results.constructionCatId = id;
        log(`  ✓ Construction Cost pipeline: ID ${id}`);

        const constructionStages = [
            { NAME: 'Site Clearing',                  SORT: 10, COLOR: '78350F' },
            { NAME: 'Piling Work',                    SORT: 20, COLOR: '92400E' },
            { NAME: 'Foundation Work',                SORT: 30, COLOR: 'B45309' },
            { NAME: 'Concrete Reinforcement',         SORT: 40, COLOR: 'D97706' },
            { NAME: 'Electrical Wiring & Plumbing',   SORT: 50, COLOR: 'F59E0B' },
            { NAME: 'Roofing',                        SORT: 60, COLOR: 'FCD34D' },
            { NAME: 'Internal & External Plastering', SORT: 70, COLOR: 'FDE68A' },
            { NAME: 'Roads & Drains',                 SORT: 80, COLOR: 'FEF3C7' },
            { NAME: 'Vacant Possession',              SORT: 90, COLOR: 'ECFDF5' },
        ];

        for (const s of constructionStages) {
            try {
                await bxPost('crm.status.add', {
                    fields: { NAME: s.NAME, SORT: s.SORT, COLOR: s.COLOR, ENTITY_ID: `DEAL_STAGE_C${id}` }
                });
                log(`    Stage "${s.NAME}"`);
            } catch (e) { log(`    Stage "${s.NAME}" error: ${e.message}`); }
        }

    } catch (e) {
        log(`  ✗ Construction Cost pipeline error: ${e.message}`);
        results.constructionCatId = null;
    }

    return results;
}

// ============================================================
// STEP 3: Create Smart Processes (SPA)
// ============================================================
async function createSmartProcesses() {
    log('Creating Smart Processes (SPA)...');
    const results = {};

    const spaDefs = [
        { key: 'loa',    title: 'LOA (Letter of Award)' },
        { key: 'vo',     title: 'VO (Variation Order)'  },
        { key: 'claims', title: 'Claims'                },
    ];

    for (const spa of spaDefs) {
        try {
            const result = await bxPost('crm.type.add', {
                fields: {
                    title: spa.title,
                    isUseInUserfieldEnabled: true,
                    isCrmTrackingEnabled: false,
                    isObserversEnabled: true,
                    isRecyclebinEnabled: true,
                    isMycompanyEnabled: false,
                    isDocumentsEnabled: true,
                    isSourceEnabled: false,
                    isStagesEnabled: true,
                    isCategoriesEnabled: false,
                }
            });
            const entityTypeId = result?.type?.entityTypeId;
            results[`${spa.key}EntityTypeId`] = entityTypeId;
            log(`  ✓ ${spa.title}: entityTypeId ${entityTypeId}`);
        } catch (e) {
            log(`  ✗ ${spa.title} error: ${e.message}`);
            results[`${spa.key}EntityTypeId`] = null;
        }
    }

    return results;
}

// ============================================================
// STEP 4: Add Custom Fields
// ============================================================
async function addCustomFields(spas) {
    log('Adding custom fields to Smart Processes...');
    const results = { loa: {}, vo: {}, claims: {}, sales: {} };

    const { loaEntityTypeId, voEntityTypeId, claimsEntityTypeId } = spas;

    // Helper to add userfield
    async function addField(entityId, fieldName, label, typeId, extraProps = {}) {
        try {
            const res = await bxPost('userfieldconfig.add', {
                moduleId: 'crm',
                field: { ENTITY_ID: entityId, FIELD_NAME: fieldName, EDIT_FORM_LABEL: label, USER_TYPE_ID: typeId, MULTIPLE: 'N', MANDATORY: 'N', SHOW_FILTER: 'Y', ...extraProps }
            });
            const id = res?.field?.id || res;
            log(`    ${fieldName}: ${id}`);
            return id;
        } catch (e) {
            log(`    ${fieldName} error: ${e.message}`);
            return null;
        }
    }

    // LOA fields
    if (loaEntityTypeId) {
        const eid = `CRM_${loaEntityTypeId}`;
        results.loa.LOA_NUMBER     = await addField(eid, 'LOA_NUMBER',     'LOA Number',          'string');
        results.loa.LOA_DATE       = await addField(eid, 'LOA_DATE',       'LOA Date',            'date');
        results.loa.MILESTONE_NAME = await addField(eid, 'MILESTONE_NAME', 'Construction Milestone', 'string');
    }

    // VO fields
    if (voEntityTypeId) {
        const eid = `CRM_${voEntityTypeId}`;
        results.vo.VO_NUMBER      = await addField(eid, 'VO_NUMBER',      'VO Number',      'string');
        results.vo.VO_DESCRIPTION = await addField(eid, 'VO_DESCRIPTION', 'VO Description', 'string');
        results.vo.VO_TYPE        = await addField(eid, 'VO_TYPE',        'VO Type',        'enumeration', {
            LIST: [{ VALUE: 'Add', SORT: 10 }, { VALUE: 'Omit', SORT: 20 }]
        });
    }

    // Claims fields
    if (claimsEntityTypeId) {
        const eid = `CRM_${claimsEntityTypeId}`;
        results.claims.CLAIM_AMOUNT = await addField(eid, 'CLAIM_AMOUNT', 'Claim Amount', 'money');
        results.claims.CLAIM_PERIOD = await addField(eid, 'CLAIM_PERIOD', 'Claim Period', 'string');
        results.claims.CLAIM_STATUS = await addField(eid, 'CLAIM_STATUS', 'Claim Status', 'enumeration', {
            LIST: [{ VALUE: 'Pending', SORT: 10 }, { VALUE: 'Approved', SORT: 20 }, { VALUE: 'Paid', SORT: 30 }]
        });
    }

    // Sales deal fields
    results.sales.BOOKING_FEE  = await addField('CRM_DEAL', 'BOOKING_FEE',  'Booking Fee',  'double');
    results.sales.DOWN_PAYMENT = await addField('CRM_DEAL', 'DOWN_PAYMENT', 'Down Payment', 'money');

    // Billing deal field (link to parent sales deal)
    results.billing = {};
    results.billing.PARENT_SALES_DEAL = await addField('CRM_DEAL', 'PARENT_SALES_DEAL', 'Parent Sales Deal', 'crm');

    return results;
}

// ============================================================
// STEP 5: Create Product Catalog
// ============================================================
async function createProductCatalog() {
    log('Creating product catalog sections...');
    const results = {};

    try {
        const gsId = await bxPost('crm.productsection.add', { fields: { NAME: 'Property Unit - Gen Soho', SORT: 100 } });
        results.genSohoSection = gsId;
        log(`  ✓ Gen Soho section: ID ${gsId}`);
    } catch (e) {
        log(`  ✗ Gen Soho section: ${e.message}`);
        results.genSohoSection = null;
    }

    try {
        const rtId = await bxPost('crm.productsection.add', { fields: { NAME: 'Property Unit - Retail', SORT: 200 } });
        results.retailSection = rtId;
        log(`  ✓ Retail section: ID ${rtId}`);
    } catch (e) {
        log(`  ✗ Retail section: ${e.message}`);
        results.retailSection = null;
    }

    if (results.genSohoSection) {
        log('  Creating Gen Soho units...');
        const units = [
            { NAME: 'A-05-01 (Type A)',   PRICE: 420000 },
            { NAME: 'A-05-02 (Type B1)',  PRICE: 380000 },
            { NAME: 'A-08-03 (Type B2)',  PRICE: 395000 },
            { NAME: 'A-10-04 (Type C)',   PRICE: 450000 },
            { NAME: 'A-15-05 (Type D)',   PRICE: 510000 },
            { NAME: 'A-15-06 (Type A)',   PRICE: 430000 },
            { NAME: 'A-20-07 (Type B1)',  PRICE: 400000 },
            { NAME: 'A-22-08 (Type C)',   PRICE: 475000 },
            { NAME: 'A-24-09 (Type D)',   PRICE: 525000 },
            { NAME: 'A-24-10 (Type A)',   PRICE: 445000 },
        ];
        for (const u of units) {
            try {
                await bxPost('crm.product.add', {
                    fields: { NAME: u.NAME, PRICE: u.PRICE, SECTION_ID: results.genSohoSection, CURRENCY_ID: 'MYR' }
                });
                process.stdout.write('.');
            } catch (e) { process.stdout.write('x'); }
        }
        console.log(' done');
    }

    if (results.retailSection) {
        log('  Creating Retail units...');
        const units = [
            { NAME: 'RT-G-01 (Ground Floor)',   PRICE: 850000 },
            { NAME: 'RT-G-02 (Ground Floor)',   PRICE: 920000 },
            { NAME: 'RT-G-03 (Ground Corner)',  PRICE: 1050000 },
            { NAME: 'RT-1-01 (Level 1)',        PRICE: 650000 },
            { NAME: 'RT-1-02 (Level 1)',        PRICE: 680000 },
            { NAME: 'RT-1-03 (Level 1)',        PRICE: 700000 },
        ];
        for (const u of units) {
            try {
                await bxPost('crm.product.add', {
                    fields: { NAME: u.NAME, PRICE: u.PRICE, SECTION_ID: results.retailSection, CURRENCY_ID: 'MYR' }
                });
                process.stdout.write('.');
            } catch (e) { process.stdout.write('x'); }
        }
        console.log(' done');
    }

    return results;
}

// ============================================================
// STEP 6: Create Sample Contacts & Deals
// ============================================================
async function createSampleData(pipelines) {
    log('Creating sample data...');

    if (!pipelines.salesCatId) {
        log('  Skipping sample data (no pipeline created)');
        return;
    }

    // Contacts
    const contacts = [
        { NAME: 'Ahmad',  LAST_NAME: 'bin Abdullah', PHONE: '+60123456789' },
        { NAME: 'Lee',    LAST_NAME: 'Wei Ming',      PHONE: '+60198765432' },
        { NAME: 'Priya',  LAST_NAME: 'Krishnan',      PHONE: '+60172345678' },
        { NAME: 'John',   LAST_NAME: 'Smith',         PHONE: '+65912345678' },
        { NAME: 'Wang',   LAST_NAME: 'Fang',          PHONE: '+60161234567' },
    ];
    const contactIds = [];
    for (const c of contacts) {
        try {
            const id = await bxPost('crm.contact.add', {
                fields: { NAME: c.NAME, LAST_NAME: c.LAST_NAME, PHONE: [{ VALUE: c.PHONE, VALUE_TYPE: 'MOBILE' }] }
            });
            contactIds.push(id);
        } catch (e) { log(`  Contact error: ${e.message}`); }
    }
    log(`  ✓ Created ${contactIds.length} contacts`);

    // Discover actual stage codes for the sales pipeline
    let stageCode = 'NEW'; // fallback
    try {
        const stages = await bxCall('crm.dealcategory.stages', { id: pipelines.salesCatId });
        const stageArr = Array.isArray(stages) ? stages : Object.values(stages || {});
        const regularStages = stageArr.filter(s => !['WON','LOSE'].includes(s.STATUS_ID));
        stageCode = regularStages[0]?.STATUS_ID || stageCode;
    } catch (e) { }

    // Sample deals
    const deals = [
        { TITLE: 'Unit A-05-01 - Ahmad Abdullah', OPPORTUNITY: 420000, stageIdx: 0 },
        { TITLE: 'Unit A-08-03 - Lee Wei Ming',   OPPORTUNITY: 395000, stageIdx: 2 },
        { TITLE: 'Unit RT-G-01 - Priya Krishnan', OPPORTUNITY: 850000, stageIdx: 1 },
        { TITLE: 'Unit A-20-07 - John Smith',      OPPORTUNITY: 400000, stageIdx: 3 },
        { TITLE: 'Unit A-22-08 - Wang Fang',       OPPORTUNITY: 475000, stageIdx: 4 },
    ];

    let dealCount = 0;
    for (let i = 0; i < deals.length; i++) {
        try {
            await bxPost('crm.deal.add', {
                fields: {
                    TITLE: deals[i].TITLE,
                    OPPORTUNITY: deals[i].OPPORTUNITY,
                    CURRENCY_ID: 'MYR',
                    STAGE_ID: stageCode,
                    CATEGORY_ID: pipelines.salesCatId,
                    CONTACT_ID: contactIds[i] || undefined
                }
            });
            dealCount++;
        } catch (e) { log(`  Deal error: ${e.message}`); }
    }
    log(`  ✓ Created ${dealCount} sample deals`);

    // Construction milestones
    if (pipelines.constructionCatId) {
        let conStageCode = `C${pipelines.constructionCatId}:NEW`;
        try {
            const stages = await bxCall('crm.dealcategory.stages', { id: pipelines.constructionCatId });
            const stageArr = Array.isArray(stages) ? stages : Object.values(stages || {});
            const regularStages = stageArr.filter(s => !['WON','LOSE'].includes(s.STATUS_ID));
            conStageCode = regularStages[0]?.STATUS_ID || conStageCode;
        } catch (e) { }

        const milestoneNames = [
            'Site Clearing', 'Piling Work', 'Foundation Work',
            'Concrete Reinforcement', 'Electrical Wiring & Plumbing',
            'Roofing', 'Internal & External Plastering', 'Roads & Drains'
        ];
        let mCount = 0;
        for (const m of milestoneNames) {
            try {
                await bxPost('crm.deal.add', {
                    fields: { TITLE: m, OPPORTUNITY: 500000, CURRENCY_ID: 'MYR', STAGE_ID: conStageCode, CATEGORY_ID: pipelines.constructionCatId }
                });
                mCount++;
            } catch (e) { }
        }
        log(`  ✓ Created ${mCount} construction milestones`);
    }
}

// ============================================================
// STEP 7: Update constants.js
// ============================================================
async function updateConstants(allIds) {
    log('Updating constants.js...');

    const { readFileSync, writeFileSync } = await import('fs');
    const { resolve, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const __dir = dirname(fileURLToPath(import.meta.url));

    const constantsPath = resolve(__dir, '../management-dashboard/src/lib/constants.js');
    let content = readFileSync(constantsPath, 'utf8');

    const { salesCatId, billingCatId, constructionCatId, genSohoSection, retailSection,
            loaEntityTypeId, voEntityTypeId, claimsEntityTypeId, fields } = allIds;

    if (salesCatId)       content = content.replace(/SALES_BOOKING:\s*\d+/, `SALES_BOOKING: ${salesCatId}`);
    if (billingCatId)     content = content.replace(/PROGRESSIVE_BILLING:\s*\d+/, `PROGRESSIVE_BILLING: ${billingCatId}`);
    if (billingCatId)     content = content.replace(/export const PROGRESSIVE_BILLING_PIPELINE_ID = \d+/, `export const PROGRESSIVE_BILLING_PIPELINE_ID = ${billingCatId}`);
    if (constructionCatId) content = content.replace(/export const CONSTRUCTION_PIPELINE_ID = \d+/, `export const CONSTRUCTION_PIPELINE_ID = ${constructionCatId}`);
    if (genSohoSection)   content = content.replace(/GEN_SOHO:\s*\d+/, `GEN_SOHO: ${genSohoSection}`);
    if (retailSection)    content = content.replace(/RETAIL:\s*\d+/, `RETAIL: ${retailSection}`);
    if (loaEntityTypeId)   content = content.replace(/export const LOA_ENTITY_TYPE = \d+/, `export const LOA_ENTITY_TYPE = ${loaEntityTypeId}`);
    if (voEntityTypeId)    content = content.replace(/export const VO_ENTITY_TYPE = \d+/, `export const VO_ENTITY_TYPE = ${voEntityTypeId}`);
    if (claimsEntityTypeId) content = content.replace(/export const CLAIM_ENTITY_TYPE = \d+/, `export const CLAIM_ENTITY_TYPE = ${claimsEntityTypeId}`);

    if (fields?.sales?.BOOKING_FEE) {
        content = content.replace(/BOOKING_FEE:\s*'[^']*'/, `BOOKING_FEE: 'UF_CRM_${fields.sales.BOOKING_FEE}'`);
    }
    if (fields?.sales?.DOWN_PAYMENT) {
        content = content.replace(/DOWN_PAYMENT:\s*'[^']*'/, `DOWN_PAYMENT: 'UF_CRM_${fields.sales.DOWN_PAYMENT}'`);
    }
    if (fields?.billing?.PARENT_SALES_DEAL) {
        content = content.replace(/PARENT_SALES_DEAL:\s*'[^']*'/, `PARENT_SALES_DEAL: 'UF_CRM_${fields.billing.PARENT_SALES_DEAL}'`);
    }

    writeFileSync(constantsPath, content);
    log('  ✓ constants.js updated');
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   Proptivio Bitrix24 Setup Script    ║');
    console.log(`║   ${WEBHOOK_URL.substring(0, 36)}...║`);
    console.log('╚══════════════════════════════════════╝\n');

    if (!process.argv[2]) {
        console.log('⚠  Using default webhook (read-only user). Pass an admin webhook as argument:');
        console.log('   node setup-bitrix24.js https://fusion.bitrix24.com/rest/<user_id>/<token>/\n');
    }

    try {
        await verifyAccess();

        const pipelines    = await createPipelines();
        const spas         = await createSmartProcesses();
        const fields       = await addCustomFields(spas);
        const catalog      = await createProductCatalog();

        await createSampleData(pipelines);

        await updateConstants({
            ...pipelines, ...spas, ...catalog, fields
        }).catch(e => log(`constants.js update skipped: ${e.message}`));

        // Save output
        const output = {
            timestamp: new Date().toISOString(),
            webhookUrl: WEBHOOK_URL,
            pipelines: { salesCatId: pipelines.salesCatId, billingCatId: pipelines.billingCatId, constructionCatId: pipelines.constructionCatId },
            catalog:   { genSohoSection: catalog.genSohoSection, retailSection: catalog.retailSection },
            spas:      { loaEntityTypeId: spas.loaEntityTypeId, voEntityTypeId: spas.voEntityTypeId, claimsEntityTypeId: spas.claimsEntityTypeId },
            fields
        };

        const { writeFileSync } = await import('fs');
        writeFileSync('./setup-output.json', JSON.stringify(output, null, 2));

        console.log('\n╔══════════════════════════════════════╗');
        console.log('║          SETUP COMPLETE              ║');
        console.log('╚══════════════════════════════════════╝');
        console.log('  Pipelines:', pipelines.salesCatId ? '✓' : '✗ (need admin webhook)');
        console.log('  SPAs:     ', spas.loaEntityTypeId ? '✓' : '✗ (need admin webhook)');
        console.log('  Catalog:  ', catalog.genSohoSection ? '✓' : '✗ (need admin webhook)');
        console.log('\n  IDs saved to: deploy/setup-output.json');
        console.log('  constants.js updated with new IDs');
        console.log('\n  Next: cd management-dashboard && npm install && npm run dev\n');

    } catch (err) {
        console.error('\n[FATAL]', err.message);
        if (err.message.includes('Access denied')) {
            console.error('\n📋 TO FIX:');
            console.error('  1. Log into fusion.bitrix24.com as administrator');
            console.error('  2. Go to: Left Menu → Developer Resources → Inbound webhooks');
            console.error('  3. Create a new webhook with ALL CRM permissions enabled');
            console.error('  4. Run: node setup-bitrix24.js <new-admin-webhook-url>');
            console.error('\n  OR grant user 152 (CY Cheong) CRM Admin access:');
            console.error('  CRM → Settings → Permissions → Roles → Edit user\'s role');
        }
        process.exit(1);
    }
}

main();
