import { NextRequest, NextResponse } from 'next/server';
import { bitrixClient } from '@/lib/bitrix/client';
import { BITRIX_CONFIG, BITRIX_FIELDS } from '@/lib/bitrix/config';

// GET single statement record
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const result = await bitrixClient.getItem(
        BITRIX_CONFIG.ENTITY_TYPE_ID,
        parseInt(id)
    );

    return NextResponse.json(result);
}

// PATCH to update statement (for approval)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    const fields: Record<string, any> = {};

    // Update approval status
    if (body.approvalStatus) {
        fields[BITRIX_FIELDS.APPROVAL_STATUS] = body.approvalStatus;
    }

    // Update process date if approving
    if (body.approvalStatus === 'APPROVED' && body.processDate) {
        fields[BITRIX_FIELDS.PROCESS_DATE] = body.processDate;
    }

    const result = await bitrixClient.updateItem(
        BITRIX_CONFIG.ENTITY_TYPE_ID,
        parseInt(id),
        fields
    );

    return NextResponse.json(result);
}
