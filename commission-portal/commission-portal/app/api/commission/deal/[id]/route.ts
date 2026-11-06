import { NextRequest, NextResponse } from 'next/server';
import { commissionService } from '@/lib/services/commission-service';
import { COMMISSION_FIELDS } from '@/lib/bitrix/commission-config';

/**
 * Get commissions for a specific deal
 *
 * GET /api/commission/deal/[id]
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const dealId = parseInt(id);

        if (isNaN(dealId)) {
            return NextResponse.json(
                { error: 'Invalid deal ID' },
                { status: 400 }
            );
        }

        // Get deal details
        let deal;
        try {
            deal = await commissionService.getDeal(dealId);
        } catch (error) {
            return NextResponse.json(
                { error: `Deal ${dealId} not found` },
                { status: 404 }
            );
        }

        // Get commissions for this deal
        const commissions = await commissionService.getDealCommissions(dealId);

        // Calculate totals
        const totalCommission = commissions.reduce((sum, c) => {
            const amount = parseFloat(c[COMMISSION_FIELDS.COMMISSION_AMOUNT]) || 0;
            return sum + amount;
        }, 0);

        return NextResponse.json({
            deal: {
                id: deal.ID,
                title: deal.TITLE,
                stageId: deal.STAGE_ID,
                opportunity: deal.OPPORTUNITY,
                currency: deal.CURRENCY_ID,
            },
            commissions: commissions.map(c => ({
                id: c.id,
                title: c.title,
                transactionDate: c[COMMISSION_FIELDS.TRANSACTION_DATE],
                transactionAmount: c[COMMISSION_FIELDS.TRANSACTION_AMOUNT],
                commissionRate: c[COMMISSION_FIELDS.COMMISSION_RATE],
                commissionAmount: c[COMMISSION_FIELDS.COMMISSION_AMOUNT],
                status: c[COMMISSION_FIELDS.APPROVAL_STATUS],
            })),
            summary: {
                totalCommissions: commissions.length,
                totalAmount: totalCommission,
            },
        });
    } catch (error) {
        console.error('Error fetching deal commissions:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch deal commissions',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
