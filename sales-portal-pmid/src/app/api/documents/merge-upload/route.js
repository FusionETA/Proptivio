import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { bitrix24 } from '@/lib/bitrix24';

/**
 * Merge multiple signed PDFs into one combined document and upload to the deal.
 * Used when multiple units are booked — each unit has its own signed OTP form,
 * and they all get merged into a single PDF stored on the deal.
 */
export async function POST(request) {
    try {
        const { dealId, signedPdfs } = await request.json();

        if (!dealId || !signedPdfs || signedPdfs.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: dealId, signedPdfs[]' },
                { status: 400 }
            );
        }

        console.log(`[MergeUpload] Merging ${signedPdfs.length} signed PDFs for deal ${dealId}`);

        // Create a new merged PDF document
        const mergedPdf = await PDFDocument.create();

        for (let i = 0; i < signedPdfs.length; i++) {
            const { base64, unitName } = signedPdfs[i];
            console.log(`[MergeUpload] Adding PDF ${i + 1}: ${unitName || 'unknown'}`);

            // Load each signed PDF
            const pdfBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const pdfDoc = await PDFDocument.load(pdfBytes);

            // Copy all pages from this PDF into the merged document
            const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
        }

        // Save the merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        const mergedPdfBase64 = Buffer.from(mergedPdfBytes).toString('base64');

        console.log(`[MergeUpload] Merged PDF created: ${mergedPdfBytes.length} bytes, uploading to deal...`);

        // Upload merged PDF to deal
        const uploadResult = await bitrix24.uploadSignedOTPToDeal(dealId, mergedPdfBase64, 'All_Units');
        console.log('[MergeUpload] Merged PDF uploaded to deal:', uploadResult.result);

        return NextResponse.json({
            success: true,
            message: `${signedPdfs.length} signed OTP forms merged and uploaded successfully`
        });
    } catch (error) {
        console.error('[MergeUpload] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
