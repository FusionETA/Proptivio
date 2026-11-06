import { NextRequest, NextResponse } from 'next/server';
import { commissionService } from '@/lib/services/commission-service';

/**
 * Rate Settings API
 *
 * GET /api/commission/rate-settings - Get all rate settings
 * POST /api/commission/rate-settings - Create or update rate setting
 */

export async function GET() {
    try {
        const settings = await commissionService.getAllRateSettings();
        const currentSetting = await commissionService.getRateSettings();

        return NextResponse.json({
            success: true,
            current: currentSetting,
            all: settings,
        });
    } catch (error) {
        console.error('Error fetching rate settings:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch rate settings',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { id, title, developerRate, agentRate, commissionRate } = body;

        // Validate rates
        if (developerRate !== undefined && (developerRate < 0 || developerRate > 1)) {
            return NextResponse.json(
                { error: 'Developer rate must be between 0 and 1' },
                { status: 400 }
            );
        }

        if (agentRate !== undefined && (agentRate < 0 || agentRate > 1)) {
            return NextResponse.json(
                { error: 'Agent rate must be between 0 and 1' },
                { status: 400 }
            );
        }

        // Validate that developer + agent rates equal 1 (100%)
        const devRate = developerRate ?? 0.5;
        const agtRate = agentRate ?? 0.5;

        if (Math.abs(devRate + agtRate - 1) > 0.001) {
            return NextResponse.json(
                { error: 'Developer rate + Agent rate must equal 1 (100%)' },
                { status: 400 }
            );
        }

        const result = await commissionService.saveRateSetting({
            id,
            title: title || 'Rate Setting',
            developerRate: devRate,
            agentRate: agtRate,
            commissionRate,
        });

        return NextResponse.json({
            success: true,
            message: id ? 'Rate setting updated' : 'Rate setting created',
            result,
        });
    } catch (error) {
        console.error('Error saving rate setting:', error);

        return NextResponse.json(
            {
                error: 'Failed to save rate setting',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
