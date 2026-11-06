import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const pdfUrl = searchParams.get('url');

        if (!pdfUrl) {
            return NextResponse.json(
                { success: false, error: 'PDF URL is required' },
                { status: 400 }
            );
        }

        // Only allow fetching from Bitrix24 domain for security
        if (!pdfUrl.includes('bitrix24.com')) {
            return NextResponse.json(
                { success: false, error: 'Invalid PDF URL' },
                { status: 400 }
            );
        }

        console.log(`[PDF Proxy] Fetching PDF from: ${pdfUrl.substring(0, 80)}...`);

        const response = await fetch(pdfUrl);

        if (!response.ok) {
            console.error(`[PDF Proxy] Fetch failed: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch PDF' },
                { status: 502 }
            );
        }

        const pdfBuffer = await response.arrayBuffer();

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="OTP_Form.pdf"',
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        console.error('[PDF Proxy] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
