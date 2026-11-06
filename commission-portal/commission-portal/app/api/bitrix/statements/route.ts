import { NextRequest, NextResponse } from 'next/server';
import { bitrixClient } from '@/lib/bitrix/client';
import { BITRIX_CONFIG, BITRIX_FIELDS } from '@/lib/bitrix/config';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const agentName = searchParams.get('agentName'); // Filter by agent name
    const accountNo = searchParams.get('accountNo'); // Or by account number
    const start = parseInt(searchParams.get('start') || '0');

    const filter: Record<string, any> = {
        categoryId: BITRIX_CONFIG.CATEGORIES.STATEMENT_RECORD,
    };

    // Filter by agent name if provided
    if (agentName) {
        filter[BITRIX_FIELDS.BUYER_NAME] = agentName;
    }

    // Or filter by account number
    if (accountNo) {
        filter[BITRIX_FIELDS.ACCOUNT_NO] = accountNo;
    }

    const result = await bitrixClient.listItems({
        entityTypeId: BITRIX_CONFIG.ENTITY_TYPE_ID,
        filter,
        select: [
            BITRIX_FIELDS.ID,
            BITRIX_FIELDS.TITLE,
            BITRIX_FIELDS.ASSIGNED_BY_ID,
            BITRIX_FIELDS.PROCESS_DATE,
            BITRIX_FIELDS.TRANSACTION_DATE,
            BITRIX_FIELDS.ACCOUNT_NO,
            BITRIX_FIELDS.BUYER_NAME,
            BITRIX_FIELDS.PROJECT_DEVELOPER,
            BITRIX_FIELDS.TRANSACTION_AMOUNT,
            BITRIX_FIELDS.COMMISSION_RATE,
            BITRIX_FIELDS.INCOME, // Statement Record specific Income field
            BITRIX_FIELDS.APPROVAL_STATUS,
            BITRIX_FIELDS.TRANSACTION_RECORD_PARENT,
        ],
        order: {
            id: 'DESC',
        },
        start,
    });

    return NextResponse.json(result);
}
