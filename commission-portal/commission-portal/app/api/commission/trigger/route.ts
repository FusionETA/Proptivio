import { NextRequest, NextResponse } from 'next/server';
import { commissionService } from '@/lib/services/commission-service';
import { COMMISSION_CONFIG } from '@/lib/bitrix/commission-config';

/**
 * Manual commission trigger endpoint
 *
 * POST /api/commission/trigger
 * Body: { dealId: number } - Process a single deal
 *
 * POST /api/commission/trigger?batch=true
 * Body: none - Process all deals currently at commission stages
 */

export async function POST(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const isBatch = searchParams.get('batch') === 'true';

        if (isBatch) {
            // Batch process all deals at commission stages
            console.log('Starting batch commission processing...');

            const result = await commissionService.processBatchCommissions();

            return NextResponse.json({
                success: true,
                message: `Batch processing complete: ${result.created} commissions created, ${result.skipped} skipped, ${result.errors} errors`,
                summary: {
                    processed: result.processed,
                    created: result.created,
                    skipped: result.skipped,
                    errors: result.errors,
                },
                details: result.results,
            });
        }

        // Single deal processing
        const body = await request.json();
        const dealId = body.dealId;

        if (!dealId) {
            return NextResponse.json(
                { error: 'Missing dealId in request body' },
                { status: 400 }
            );
        }

        console.log(`Processing commission for deal ${dealId}...`);

        // Get deal details
        const deal = await commissionService.getDeal(dealId);

        if (!deal) {
            return NextResponse.json(
                { error: `Deal ${dealId} not found` },
                { status: 404 }
            );
        }

        // Process the stage change
        const result = await commissionService.processStageChange({
            dealId: parseInt(deal.ID),
            stageId: deal.STAGE_ID,
            categoryId: parseInt(deal.CATEGORY_ID),
            opportunity: parseFloat(deal.OPPORTUNITY) || 0,
            title: deal.TITLE,
        });

        return NextResponse.json({
            success: result.success,
            message: result.message,
            deal: {
                id: deal.ID,
                title: deal.TITLE,
                stageId: deal.STAGE_ID,
                opportunity: deal.OPPORTUNITY,
            },
            commissions: result.commissions,
        });
    } catch (error) {
        console.error('Commission trigger error:', error);

        return NextResponse.json(
            {
                error: 'Failed to process commission',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * Get commission trigger status and configuration
 */
export async function GET() {
    return NextResponse.json({
        status: 'active',
        pipeline: {
            id: COMMISSION_CONFIG.PIPELINE_ID,
            name: 'Progressive Billing',
        },
        commissionStages: Object.entries(COMMISSION_CONFIG.STAGES).map(([id, config]) => ({
            stageId: id,
            name: config.name,
            stageNumber: config.stageNumber,
            rate: `${config.rate * 100}%`,
            description: config.description,
        })),
        endpoints: {
            triggerSingle: 'POST /api/commission/trigger with { dealId: number }',
            triggerBatch: 'POST /api/commission/trigger?batch=true',
            webhook: 'POST /api/webhook/deal-stage-change',
        },
    });
}
