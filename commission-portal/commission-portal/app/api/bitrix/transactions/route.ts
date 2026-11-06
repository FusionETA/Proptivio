import { NextRequest, NextResponse } from 'next/server';
import { bitrixClient } from '@/lib/bitrix/client';
import { BITRIX_CONFIG, BITRIX_FIELDS } from '@/lib/bitrix/config';

// Cache for user names (refreshes on server restart)
const userNameCache: Record<string, string> = {};

// Fetch user name from Bitrix24
async function getUserName(userId: string): Promise<string> {
    if (!userId) return '-';
    if (userNameCache[userId]) return userNameCache[userId];

    try {
        const result = await bitrixClient.call('user.get', { ID: userId });
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

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const start = parseInt(searchParams.get('start') || '0');

    const filter: Record<string, any> = {
        categoryId: BITRIX_CONFIG.CATEGORIES.TRANSACTION,
    };

    // Add date range filter if provided
    if (startDate) {
        filter[`>=${BITRIX_FIELDS.TRANSACTION_DATE}`] = startDate;
    }
    if (endDate) {
        filter[`<=${BITRIX_FIELDS.TRANSACTION_DATE}`] = endDate;
    }

    const result = await bitrixClient.listItems({
        entityTypeId: BITRIX_CONFIG.ENTITY_TYPE_ID,
        filter,
        select: [
            BITRIX_FIELDS.ID,
            BITRIX_FIELDS.TITLE,
            BITRIX_FIELDS.ASSIGNED_BY_ID,
            BITRIX_FIELDS.CREATED_TIME,
            BITRIX_FIELDS.UPDATED_TIME,
            BITRIX_FIELDS.PROCESS_DATE,
            BITRIX_FIELDS.TRANSACTION_DATE,
            BITRIX_FIELDS.ACCOUNT_NO,
            BITRIX_FIELDS.BUYER_NAME,
            BITRIX_FIELDS.PROJECT_DEVELOPER,
            BITRIX_FIELDS.TRANSACTION_AMOUNT,
            BITRIX_FIELDS.COMMISSION_RATE,
            BITRIX_FIELDS.COMMISSION_AMOUNT,
            BITRIX_FIELDS.DEVELOPER_RATE,
            BITRIX_FIELDS.DEVELOPER_INCOME,
            BITRIX_FIELDS.DEVELOPER_PAYABLE_INCOME,
            BITRIX_FIELDS.AGENT_RATE,
            BITRIX_FIELDS.AGENT_INCOME,
            BITRIX_FIELDS.AGENT_PAYABLE_INCOME,
            BITRIX_FIELDS.DEAL_ID,
            BITRIX_FIELDS.TRANSACTION_RECORD_PARENT,
            BITRIX_FIELDS.ERROR_MESSAGE,
            BITRIX_FIELDS.APPROVAL_STATUS,
        ],
        order: {
            id: 'DESC',
        },
        start,
    });

    // Fetch deal info to get agent (ASSIGNED_BY_ID)
    if (result.items && result.items.length > 0) {
        const dealIds = [...new Set(result.items.map((t: any) => t[BITRIX_FIELDS.DEAL_ID]).filter(Boolean))];

        if (dealIds.length > 0) {
            try {
                const dealsResult = await bitrixClient.call('crm.deal.list', {
                    filter: { ID: dealIds },
                    select: ['ID', 'TITLE', 'ASSIGNED_BY_ID'],
                });

                const deals: Record<string, any> = {};
                for (const deal of dealsResult || []) {
                    deals[deal.ID] = deal;
                }

                // Get unique agent IDs and fetch their names
                const agentIds: string[] = [...new Set(
                    result.items.map((item: any) => {
                        const dealId = item[BITRIX_FIELDS.DEAL_ID];
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

                // Add agent info to each transaction
                result.items = result.items.map((item: any) => {
                    const dealId = item[BITRIX_FIELDS.DEAL_ID];
                    const deal = deals[dealId];
                    const agentId = deal?.ASSIGNED_BY_ID || item.assignedById || '';
                    return {
                        ...item,
                        agentId,
                        agentName: userNames[agentId] || '-',
                        dealTitle: deal?.TITLE || '',
                    };
                });
            } catch (error) {
                console.error('Failed to fetch deal info:', error);
            }
        }
    }

    return NextResponse.json(result);
}
