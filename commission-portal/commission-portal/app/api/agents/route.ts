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
    if (!userId || userId === 'unknown') return 'Unknown';
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
 * GET /api/agents - Get all agents with their commission totals
 */
export async function GET(request: NextRequest) {
    try {
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
                COMMISSION_FIELDS.TRANSACTION_AMOUNT,
                COMMISSION_FIELDS.COMMISSION_RATE,
                COMMISSION_FIELDS.COMMISSION_AMOUNT,
                COMMISSION_FIELDS.AGENT_INCOME,
                COMMISSION_FIELDS.DEVELOPER_INCOME,
                COMMISSION_FIELDS.APPROVAL_STATUS,
            ],
        });

        if (!transactions.items || transactions.items.length === 0) {
            return NextResponse.json({ agents: [], total: 0 });
        }

        // Get unique deal IDs to fetch deal info (for ASSIGNED_BY_ID)
        const dealIds = [...new Set(transactions.items.map((t: any) => t[COMMISSION_FIELDS.DEAL_ID]).filter(Boolean))];

        // Fetch deals to get responsible agent
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

        // Get unique agent IDs and fetch their names
        const agentIds: string[] = [...new Set(
            transactions.items.map((item: any) => {
                const dealId = item[COMMISSION_FIELDS.DEAL_ID];
                const deal = deals[dealId];
                return deal?.ASSIGNED_BY_ID || item.assignedById || '';
            }).filter(Boolean)
        )] as string[];

        // Fetch all user names in parallel
        const userNames: Record<string, string> = {};
        await Promise.all(
            agentIds.map(async (id: string) => {
                userNames[id] = await getUserName(id);
            })
        );

        // Group transactions by agent (ASSIGNED_BY_ID from deal)
        const agentsMap: Record<string, {
            id: string;
            name: string;
            totalSales: number;
            totalCommission: number;
            agentIncome: number;
            developerIncome: number;
            transactionCount: number;
            pendingCount: number;
            approvedCount: number;
            transactions: any[];
        }> = {};

        for (const item of transactions.items) {
            const dealId = item[COMMISSION_FIELDS.DEAL_ID];
            const deal = deals[dealId];
            const agentId = deal?.ASSIGNED_BY_ID || item.assignedById || 'unknown';
            const agentName = userNames[agentId] || 'Unknown';

            if (!agentsMap[agentId]) {
                agentsMap[agentId] = {
                    id: agentId,
                    name: agentName,
                    totalSales: 0,
                    totalCommission: 0,
                    agentIncome: 0,
                    developerIncome: 0,
                    transactionCount: 0,
                    pendingCount: 0,
                    approvedCount: 0,
                    transactions: [],
                };
            }

            const agent = agentsMap[agentId];
            const transactionAmount = parseFloat(item[COMMISSION_FIELDS.TRANSACTION_AMOUNT] || 0);
            const commissionAmount = parseFloat(item[COMMISSION_FIELDS.COMMISSION_AMOUNT] || 0);
            const agentIncome = parseFloat(item[COMMISSION_FIELDS.AGENT_INCOME] || 0);
            const developerIncome = parseFloat(item[COMMISSION_FIELDS.DEVELOPER_INCOME] || 0);
            const status = item[COMMISSION_FIELDS.APPROVAL_STATUS] || 'PENDING';

            agent.totalSales += transactionAmount;
            agent.totalCommission += commissionAmount;
            agent.agentIncome += agentIncome;
            agent.developerIncome += developerIncome;
            agent.transactionCount += 1;

            if (status === 'APPROVED') {
                agent.approvedCount += 1;
            } else {
                agent.pendingCount += 1;
            }

            agent.transactions.push({
                id: item.id,
                title: item.title,
                dealId,
                dealTitle: deal?.TITLE,
                buyerName: item[COMMISSION_FIELDS.BUYER_NAME],
                project: item[COMMISSION_FIELDS.PROJECT_DEVELOPER],
                transactionAmount,
                commissionRate: parseFloat(item[COMMISSION_FIELDS.COMMISSION_RATE] || 0),
                commissionAmount,
                agentIncome,
                developerIncome,
                status,
            });
        }

        const agents = Object.values(agentsMap).sort((a, b) => b.totalCommission - a.totalCommission);

        return NextResponse.json({
            agents,
            total: agents.length,
            summary: {
                totalSales: agents.reduce((sum, a) => sum + a.totalSales, 0),
                totalCommission: agents.reduce((sum, a) => sum + a.totalCommission, 0),
                totalAgentIncome: agents.reduce((sum, a) => sum + a.agentIncome, 0),
                totalDeveloperIncome: agents.reduce((sum, a) => sum + a.developerIncome, 0),
            },
        });
    } catch (error) {
        console.error('Agents API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch agents', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
