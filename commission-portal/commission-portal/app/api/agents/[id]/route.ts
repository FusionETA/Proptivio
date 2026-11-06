import { NextRequest, NextResponse } from 'next/server';
import { COMMISSION_CONFIG, COMMISSION_FIELDS } from '@/lib/bitrix/commission-config';
import { BITRIX_CONFIG } from '@/lib/bitrix/config';

const WEBHOOK_URL = COMMISSION_CONFIG.WEBHOOK_URL;
const USER_WEBHOOK_URL = BITRIX_CONFIG.WEBHOOK_URL; // Has user.get permission

// Cache for user names (refreshes on server restart)
const userNameCache: Record<string, string> = {};

async function callBitrix(method: string, params: Record<string, any> = {}, useUserWebhook = false) {
    const url = `${useUserWebhook ? USER_WEBHOOK_URL : WEBHOOK_URL}/${method}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        cache: 'no-store',
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error_description || data.error);
    return data.result;
}

// Fetch user name from Bitrix24
async function getUserName(userId: string): Promise<string> {
    if (!userId) return 'Unknown';
    if (userNameCache[userId]) return userNameCache[userId];

    try {
        const result = await callBitrix('user.get', { ID: userId }, true);
        if (result && result[0]) {
            const user = result[0];
            const name = [user.NAME, user.LAST_NAME].filter(Boolean).join(' ') || `User ${userId}`;
            userNameCache[userId] = name;
            return name;
        }
    } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
    }
    return `User ${userId}`;
}

/**
 * GET /api/agents/[id] - Get agent details with all transactions
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: agentId } = await params;

        // Get all commission transactions
        const transactions = await callBitrix('crm.item.list', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            filter: { categoryId: COMMISSION_CONFIG.CATEGORIES.TRANSACTION },
            select: [
                'id',
                'title',
                'assignedById',
                COMMISSION_FIELDS.DEAL_ID,
                COMMISSION_FIELDS.BUYER_NAME,
                COMMISSION_FIELDS.PROJECT_DEVELOPER,
                COMMISSION_FIELDS.TRANSACTION_DATE,
                COMMISSION_FIELDS.PROCESS_DATE,
                COMMISSION_FIELDS.TRANSACTION_AMOUNT,
                COMMISSION_FIELDS.COMMISSION_RATE,
                COMMISSION_FIELDS.COMMISSION_AMOUNT,
                COMMISSION_FIELDS.AGENT_INCOME,
                COMMISSION_FIELDS.AGENT_RATE,
                COMMISSION_FIELDS.DEVELOPER_INCOME,
                COMMISSION_FIELDS.DEVELOPER_RATE,
                COMMISSION_FIELDS.APPROVAL_STATUS,
            ],
        });

        if (!transactions.items || transactions.items.length === 0) {
            return NextResponse.json({ error: 'No transactions found' }, { status: 404 });
        }

        // Get unique deal IDs
        const dealIds = [...new Set(transactions.items.map((t: any) => t[COMMISSION_FIELDS.DEAL_ID]).filter(Boolean))];

        // Fetch deals
        const deals: Record<string, any> = {};
        if (dealIds.length > 0) {
            const dealsResult = await callBitrix('crm.deal.list', {
                filter: { ID: dealIds },
                select: ['ID', 'TITLE', 'ASSIGNED_BY_ID'],
            });
            for (const deal of dealsResult || []) {
                deals[deal.ID] = deal;
            }
        }

        // Filter transactions for this agent
        const agentTransactions = transactions.items.filter((item: any) => {
            const dealId = item[COMMISSION_FIELDS.DEAL_ID];
            const deal = deals[dealId];
            const itemAgentId = deal?.ASSIGNED_BY_ID || item.assignedById;
            return itemAgentId === agentId;
        });

        if (agentTransactions.length === 0) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        // Fetch agent name from Bitrix
        const agentName = await getUserName(agentId);

        // Calculate totals
        let totalSales = 0;
        let totalCommission = 0;
        let agentIncome = 0;
        let developerIncome = 0;
        let pendingCount = 0;
        let approvedCount = 0;

        const formattedTransactions = agentTransactions.map((item: any) => {
            const dealId = item[COMMISSION_FIELDS.DEAL_ID];
            const deal = deals[dealId];
            const transactionAmount = parseFloat(item[COMMISSION_FIELDS.TRANSACTION_AMOUNT] || 0);
            const commissionAmount = parseFloat(item[COMMISSION_FIELDS.COMMISSION_AMOUNT] || 0);
            const itemAgentIncome = parseFloat(item[COMMISSION_FIELDS.AGENT_INCOME] || 0);
            const itemDeveloperIncome = parseFloat(item[COMMISSION_FIELDS.DEVELOPER_INCOME] || 0);
            const status = item[COMMISSION_FIELDS.APPROVAL_STATUS] || 'PENDING';

            totalSales += transactionAmount;
            totalCommission += commissionAmount;
            agentIncome += itemAgentIncome;
            developerIncome += itemDeveloperIncome;

            if (status === 'APPROVED') {
                approvedCount++;
            } else {
                pendingCount++;
            }

            return {
                id: item.id,
                title: item.title,
                dealId,
                dealTitle: deal?.TITLE,
                buyerName: item[COMMISSION_FIELDS.BUYER_NAME],
                project: item[COMMISSION_FIELDS.PROJECT_DEVELOPER],
                transactionDate: item[COMMISSION_FIELDS.TRANSACTION_DATE],
                processDate: item[COMMISSION_FIELDS.PROCESS_DATE],
                transactionAmount,
                commissionRate: parseFloat(item[COMMISSION_FIELDS.COMMISSION_RATE] || 0),
                commissionAmount,
                agentRate: parseFloat(item[COMMISSION_FIELDS.AGENT_RATE] || 0),
                agentIncome: itemAgentIncome,
                developerRate: parseFloat(item[COMMISSION_FIELDS.DEVELOPER_RATE] || 0),
                developerIncome: itemDeveloperIncome,
                status,
            };
        });

        return NextResponse.json({
            agent: {
                id: agentId,
                name: agentName,
                totalSales,
                totalCommission,
                agentIncome,
                developerIncome,
                transactionCount: formattedTransactions.length,
                pendingCount,
                approvedCount,
            },
            transactions: formattedTransactions,
        });
    } catch (error) {
        console.error('Agent API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch agent data', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
