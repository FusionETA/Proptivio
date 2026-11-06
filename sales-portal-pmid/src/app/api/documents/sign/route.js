import { NextResponse } from 'next/server';
import { bitrix24 } from '@/lib/bitrix24';

export async function POST(request) {
    try {
        const { dealId, contactId, signatureBase64, signedPdfBase64, unitName, skipUpload } = await request.json();

        if (!dealId || !contactId || !signatureBase64 || !signedPdfBase64) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: dealId, contactId, signatureBase64, signedPdfBase64' },
                { status: 400 }
            );
        }

        console.log(`[Sign] Processing signed document for deal ${dealId}, contact ${contactId}${unitName ? ` (${unitName})` : ''}`);

        // Clean the signature base64 (strip data URL prefix if present)
        const cleanBase64 = signatureBase64.replace(/^data:image\/png;base64,/, '');

        // Step 1: Save signature image to Contact's "Signature" field
        console.log('[Sign] Saving signature to contact...');
        const signatureResult = await bitrix24.saveSignatureToContact(contactId, cleanBase64);
        console.log('[Sign] Signature saved to contact:', signatureResult.result);

        // Step 2: Upload signed PDF to deal (only if not skipping — for multi-unit, upload is done at the end)
        if (!skipUpload) {
            console.log('[Sign] Uploading signed PDF to deal...');
            const uploadResult = await bitrix24.uploadSignedOTPToDeal(dealId, signedPdfBase64, unitName || '');
            console.log('[Sign] Signed PDF uploaded to deal:', uploadResult.result);
        } else {
            console.log('[Sign] Skipping PDF upload (multi-unit mode — will merge and upload at end)');
        }

        return NextResponse.json({
            success: true,
            message: 'Document signed successfully'
        });
    } catch (error) {
        console.error('[Sign] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
