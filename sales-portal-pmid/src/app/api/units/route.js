import { NextResponse } from 'next/server';
import { bitrix24 } from '@/lib/bitrix24';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category'); // 'soho', 'retail', or 'all'

        // Optional filters
        const filters = {};
        if (status) {
            filters.PROPERTY_STATUS = status;
        }

        let units = [];

        // Fetch based on category parameter
        if (!category || category === 'all') {
            // Fetch SOHO, Retail, and Pantai Remis units in parallel
            const [sohoUnits, retailUnits, pantaiRemisUnits] = await Promise.all([
                bitrix24.getUnits(filters),
                bitrix24.getRetailUnits(),
                bitrix24.getPantaiRemisUnits()
            ]);
            units = [...sohoUnits, ...retailUnits, ...pantaiRemisUnits];
        } else if (category === 'soho') {
            units = await bitrix24.getUnits(filters);
        } else if (category === 'retail') {
            units = await bitrix24.getRetailUnits();
        } else if (category === 'pantairemis') {
            units = await bitrix24.getPantaiRemisUnits();
        }

        return NextResponse.json({
            success: true,
            units,
            count: units.length
        });
    } catch (error) {
        console.error('Error fetching units:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Internal Server Error'
            },
            { status: 500 }
        );
    }
}
