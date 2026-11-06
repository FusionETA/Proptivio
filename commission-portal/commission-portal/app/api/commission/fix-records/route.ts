import { NextRequest, NextResponse } from 'next/server';
import { COMMISSION_CONFIG, COMMISSION_FIELDS } from '@/lib/bitrix/commission-config';

const WEBHOOK_URL = COMMISSION_CONFIG.WEBHOOK_URL;

// Product section to project name mapping
const SECTION_TO_PROJECT: Record<number, string> = {
    16: 'Gen Soho',
    52: 'Retail',
};

async function callBitrix(method: string, params: Record<string, any> = {}) {
    const url = `${WEBHOOK_URL}/${method}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error_description || data.error);
    return data.result;
}

async function getClientName(contactId: number): Promise<string> {
    try {
        const contact = await callBitrix('crm.contact.get', { id: contactId });
        if (contact) {
            const parts = [contact.NAME, contact.SECOND_NAME, contact.LAST_NAME].filter(Boolean);
            return parts.join(' ') || contact.NAME || '';
        }
    } catch (error) {
        console.error('Failed to get contact:', error);
    }
    return '';
}

async function getProjectFromProduct(productName: string): Promise<string> {
    try {
        const result = await callBitrix('crm.product.list', { filter: { NAME: productName } });
        if (result && result.length > 0) {
            const product = result[0];
            if (product.SECTION_ID) {
                const sectionId = parseInt(product.SECTION_ID);
                return SECTION_TO_PROJECT[sectionId] || '';
            }
        }
    } catch (error) {
        console.error('Failed to get product:', error);
    }
    return '';
}

/**
 * Fix existing commission records with correct buyer name and project
 * POST /api/commission/fix-records
 */
export async function POST(request: NextRequest) {
    try {
        // Get all commission transactions
        const transactions = await callBitrix('crm.item.list', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            filter: { categoryId: COMMISSION_CONFIG.CATEGORIES.TRANSACTION },
            select: [
                'id',
                'title',
                COMMISSION_FIELDS.DEAL_ID,
                COMMISSION_FIELDS.BUYER_NAME,
                COMMISSION_FIELDS.PROJECT_DEVELOPER,
            ],
        });

        if (!transactions.items || transactions.items.length === 0) {
            return NextResponse.json({ success: true, message: 'No transactions to fix', fixed: 0 });
        }

        const results: Array<{ id: number; dealId: string; changes: Record<string, any>; success: boolean }> = [];

        for (const item of transactions.items) {
            const dealId = item[COMMISSION_FIELDS.DEAL_ID];
            if (!dealId) continue;

            // Get deal details
            let deal: any;
            try {
                deal = await callBitrix('crm.deal.get', { id: parseInt(dealId) });
            } catch (error) {
                console.error(`Failed to get deal ${dealId}:`, error);
                continue;
            }

            const changes: Record<string, any> = {};

            // Fix buyer name if empty or looks like unit name
            const currentBuyerName = item[COMMISSION_FIELDS.BUYER_NAME] || '';
            const needsBuyerFix = !currentBuyerName ||
                currentBuyerName.toLowerCase().includes('unit') ||
                currentBuyerName === deal.TITLE;

            if (needsBuyerFix && deal.CONTACT_ID) {
                const clientName = await getClientName(parseInt(deal.CONTACT_ID));
                if (clientName) {
                    changes[COMMISSION_FIELDS.BUYER_NAME] = clientName;
                }
            }

            // Fix project name if empty
            const currentProject = item[COMMISSION_FIELDS.PROJECT_DEVELOPER] || '';
            if (!currentProject && deal.TITLE) {
                const projectName = await getProjectFromProduct(deal.TITLE);
                if (projectName) {
                    changes[COMMISSION_FIELDS.PROJECT_DEVELOPER] = projectName;
                }
            }

            // Update if there are changes
            if (Object.keys(changes).length > 0) {
                try {
                    await callBitrix('crm.item.update', {
                        entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
                        id: item.id,
                        fields: changes,
                    });
                    results.push({ id: item.id, dealId, changes, success: true });
                } catch (error) {
                    console.error(`Failed to update item ${item.id}:`, error);
                    results.push({ id: item.id, dealId, changes, success: false });
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Fixed ${results.filter(r => r.success).length} records`,
            totalChecked: transactions.items.length,
            results,
        });
    } catch (error) {
        console.error('Fix records error:', error);
        return NextResponse.json(
            { error: 'Failed to fix records', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * GET - Show status of records that need fixing
 */
export async function GET() {
    try {
        const transactions = await callBitrix('crm.item.list', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            filter: { categoryId: COMMISSION_CONFIG.CATEGORIES.TRANSACTION },
            select: [
                'id',
                'title',
                COMMISSION_FIELDS.DEAL_ID,
                COMMISSION_FIELDS.BUYER_NAME,
                COMMISSION_FIELDS.PROJECT_DEVELOPER,
            ],
        });

        const needsFix: any[] = [];
        const ok: any[] = [];

        for (const item of transactions.items || []) {
            const buyerName = item[COMMISSION_FIELDS.BUYER_NAME] || '';
            const project = item[COMMISSION_FIELDS.PROJECT_DEVELOPER] || '';

            const hasBuyerIssue = !buyerName || buyerName.toLowerCase().includes('unit');
            const hasProjectIssue = !project;

            if (hasBuyerIssue || hasProjectIssue) {
                needsFix.push({
                    id: item.id,
                    title: item.title,
                    dealId: item[COMMISSION_FIELDS.DEAL_ID],
                    buyerName,
                    project,
                    issues: [
                        hasBuyerIssue ? 'buyer_name' : null,
                        hasProjectIssue ? 'project' : null,
                    ].filter(Boolean),
                });
            } else {
                ok.push({ id: item.id, title: item.title, buyerName, project });
            }
        }

        return NextResponse.json({
            total: transactions.items?.length || 0,
            needsFix: needsFix.length,
            ok: ok.length,
            recordsNeedingFix: needsFix,
            recordsOk: ok,
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to check records', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
