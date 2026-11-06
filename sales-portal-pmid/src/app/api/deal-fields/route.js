import { NextResponse } from 'next/server';
import { bitrix24 } from '@/lib/bitrix24';

// Utility endpoint to check Bitrix24 field structure
export async function GET() {
    try {
        const fields = await bitrix24.getDealFields();

        return NextResponse.json({
            success: true,
            fields
        });
    } catch (error) {
        console.error('Error fetching deal fields:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}
