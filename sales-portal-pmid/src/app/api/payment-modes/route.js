import { NextResponse } from 'next/server';
import { bitrix24 } from '@/lib/bitrix24';

export async function GET() {
    try {
        const response = await bitrix24.callMethod('crm.deal.fields');
        const field = response.result?.UF_CRM_1770945008938;

        if (!field || !field.items) {
            return NextResponse.json({ success: false, error: 'Field not found' }, { status: 404 });
        }

        const options = field.items.map(item => ({
            id: item.ID,
            label: item.VALUE
        }));

        return NextResponse.json({ success: true, options });
    } catch (error) {
        console.error('[Payment Modes] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
