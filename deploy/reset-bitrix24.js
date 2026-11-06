#!/usr/bin/env node
/**
 * Proptivio Bitrix24 Reset Script
 * Removes all pipelines, SPAs, products, contacts, and deals created by setup-bitrix24.js
 * USE WITH CAUTION — this deletes data!
 *
 * Usage: node reset-bitrix24.js <admin-webhook-url>
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
    if (data.error && data.error_description !== '') throw new Error(`${method}: ${data.error_description || data.error}`);
    return data.result;
}

async function bxPost(method, body = {}) {
    const res = await fetch(WEBHOOK_URL + method, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.error && data.error_description !== '') throw new Error(`${method}: ${data.error_description || data.error}`);
    return data.result;
}

async function main() {
    console.log('\n⚠️  PROPTIVIO BITRIX24 RESET');
    console.log('This will delete all deals, contacts, products, pipelines, and SPAs.');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise(r => setTimeout(r, 5000));

    // Read setup output for IDs
    let ids = {};
    try {
        const { readFileSync } = await import('fs');
        ids = JSON.parse(readFileSync('./setup-output.json', 'utf8'));
        log('Loaded setup-output.json');
    } catch (e) {
        log('No setup-output.json found, will discover IDs...');
    }

    // Delete all deals
    log('Deleting all deals...');
    try {
        const deals = await bxCall('crm.deal.list', { start: 0, select: ['ID'] });
        const dealList = Array.isArray(deals) ? deals : [];
        for (const d of dealList) {
            try { await bxPost('crm.deal.delete', { id: d.ID }); process.stdout.write('.'); } catch (e) { }
        }
        console.log(` deleted ${dealList.length}`);
    } catch (e) { log(`Deals: ${e.message}`); }

    // Delete all contacts
    log('Deleting all contacts...');
    try {
        const contacts = await bxCall('crm.contact.list', { start: 0, select: ['ID'] });
        const contactList = Array.isArray(contacts) ? contacts : [];
        for (const c of contactList) {
            try { await bxPost('crm.contact.delete', { id: c.ID }); process.stdout.write('.'); } catch (e) { }
        }
        console.log(` deleted ${contactList.length}`);
    } catch (e) { log(`Contacts: ${e.message}`); }

    // Delete all products
    log('Deleting all products...');
    try {
        const products = await bxCall('crm.product.list', { start: 0, select: ['ID'] });
        const productList = Array.isArray(products) ? products : [];
        for (const p of productList) {
            try { await bxPost('crm.product.delete', { id: p.ID }); process.stdout.write('.'); } catch (e) { }
        }
        console.log(` deleted ${productList.length}`);
    } catch (e) { log(`Products: ${e.message}`); }

    // Delete pipelines (custom categories only)
    log('Deleting custom pipelines...');
    try {
        const cats = await bxCall('crm.dealcategory.list');
        const catList = Array.isArray(cats) ? cats : [];
        for (const c of catList) {
            if (c.IS_DEFAULT !== 'Y') {
                try { await bxPost('crm.dealcategory.delete', { id: c.ID }); log(`  Deleted pipeline: ${c.NAME}`); } catch (e) { }
            }
        }
    } catch (e) { log(`Pipelines: ${e.message}`); }

    // Delete Smart Processes
    if (ids.spas) {
        log('Deleting Smart Processes...');
        for (const [key, entityTypeId] of Object.entries(ids.spas)) {
            if (!entityTypeId) continue;
            try {
                await bxPost('crm.type.delete', { entityTypeId });
                log(`  Deleted SPA: ${key} (${entityTypeId})`);
            } catch (e) { log(`  SPA ${key}: ${e.message}`); }
        }
    }

    console.log('\n✓ Reset complete\n');
}

main().catch(err => {
    console.error('\n[ERROR]', err.message);
    process.exit(1);
});
