import { NextRequest, NextResponse } from 'next/server';
import { commissionService } from '@/lib/services/commission-service';
import { COMMISSION_CONFIG } from '@/lib/bitrix/commission-config';

/**
 * Webhook endpoint for Bitrix24 deal stage change events
 *
 * To set up in Bitrix24:
 * 1. Go to Developer resources > Webhooks > Outbound webhooks
 * 2. Create a new webhook with event: onCrmDealUpdate
 * 3. Set the handler URL to: https://your-domain.com/api/webhook/deal-stage-change
 *
 * Or use Automation Rules:
 * 1. Go to CRM > Deals > Progressive Billing pipeline
 * 2. Add automation rule on each commission stage (Site Clearing, Piling Work, Concrete Reinforcement)
 * 3. Add action "Webhook" pointing to this endpoint
 */

export async function POST(request: NextRequest) {
    try {
        // Bitrix24 can send data as form-urlencoded or JSON
        const contentType = request.headers.get('content-type') || '';
        let body: any;

        if (contentType.includes('application/x-www-form-urlencoded')) {
            // Parse form data (Bitrix24 outbound webhook format)
            const formData = await request.formData();
            body = {};
            formData.forEach((value, key) => {
                // Handle nested keys like "data[FIELDS][ID]"
                if (key.includes('[')) {
                    const matches = key.match(/([^\[]+)|\[([^\]]*)\]/g);
                    if (matches) {
                        let current = body;
                        for (let i = 0; i < matches.length - 1; i++) {
                            const k = matches[i].replace(/[\[\]]/g, '');
                            if (!current[k]) current[k] = {};
                            current = current[k];
                        }
                        const lastKey = matches[matches.length - 1].replace(/[\[\]]/g, '');
                        current[lastKey] = value;
                    }
                } else {
                    body[key] = value;
                }
            });
        } else {
            // Parse JSON
            body = await request.json();
        }

        console.log('Received webhook:', JSON.stringify(body, null, 2));

        // Bitrix24 sends data in different formats depending on the event type
        // Handle both direct webhook and automation rule formats
        let dealId: number;
        let stageId: string;
        let categoryId: number;
        let opportunity: number;
        let title: string | undefined;

        // Format 1: Direct event webhook (onCrmDealUpdate) - form data format
        // Bitrix sends: data[FIELDS][ID], event, etc.
        if (body.data?.FIELDS?.ID) {
            dealId = parseInt(body.data.FIELDS.ID);

            // Need to fetch deal details to get stage and opportunity
            const dealDetails = await commissionService.getDeal(dealId);
            stageId = dealDetails.STAGE_ID;
            categoryId = parseInt(dealDetails.CATEGORY_ID);
            opportunity = parseFloat(dealDetails.OPPORTUNITY) || 0;
            title = dealDetails.TITLE;

            console.log(`Processing deal ${dealId}: stage=${stageId}, category=${categoryId}, amount=${opportunity}`);
        }
        // Format 2: Automation rule webhook (custom payload)
        else if (body.dealId) {
            dealId = parseInt(body.dealId);
            stageId = body.stageId;
            categoryId = parseInt(body.categoryId);
            opportunity = parseFloat(body.opportunity) || 0;
            title = body.title;
        }
        // Format 3: Manual trigger with deal ID only
        else if (body.id) {
            dealId = parseInt(body.id);

            // Fetch deal details
            const dealDetails = await commissionService.getDeal(dealId);
            stageId = dealDetails.STAGE_ID;
            categoryId = parseInt(dealDetails.CATEGORY_ID);
            opportunity = parseFloat(dealDetails.OPPORTUNITY) || 0;
            title = dealDetails.TITLE;
        }
        else {
            console.log('Invalid webhook payload - no deal ID found:', body);
            return NextResponse.json(
                { error: 'Invalid webhook payload: missing deal ID', receivedBody: body },
                { status: 400 }
            );
        }

        // Process the stage change
        const result = await commissionService.processStageChange({
            dealId,
            stageId,
            categoryId,
            opportunity,
            title,
        });

        console.log('Commission processing result:', result);

        return NextResponse.json({
            success: result.success,
            message: result.message,
            dealId,
            stageId,
            commissions: result.commissions,
        });
    } catch (error) {
        console.error('Webhook processing error:', error);

        return NextResponse.json(
            {
                error: 'Failed to process webhook',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * Handle Bitrix24 webhook verification (GET request)
 */
export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        message: 'Commission webhook endpoint is active',
        supportedStages: Object.entries(COMMISSION_CONFIG.STAGES).map(([id, config]) => ({
            stageId: id,
            name: config.name,
            rate: `${config.rate * 100}%`,
        })),
    });
}
