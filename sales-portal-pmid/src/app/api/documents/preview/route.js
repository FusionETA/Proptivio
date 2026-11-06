import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { bitrix24 } from '@/lib/bitrix24';

export async function POST(request) {
    try {
        const { signatureBase64, pdfUrl } = await request.json();

        if (!signatureBase64 || !pdfUrl) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: signatureBase64, pdfUrl' },
                { status: 400 }
            );
        }

        console.log('[Preview] Generating signed PDF preview...');

        // Step 1: Fetch the original PDF from Bitrix24
        const pdfArrayBuffer = await bitrix24.fetchPdfFromUrl(pdfUrl);
        console.log(`[Preview] PDF fetched, size: ${pdfArrayBuffer.byteLength} bytes`);

        // Step 2: Embed signature into the PDF
        const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
        const pages = pdfDoc.getPages();

        // The new OTP template is a single-page A4 document; signature section is at the bottom.
        // Fall back to the last page for any page count.
        const signaturePage = pages[pages.length - 1];
        const pageIndex = pages.length;
        console.log(`[Preview] Placing signature on page ${pageIndex} of ${pages.length}`);

        // Decode signature base64
        const cleanBase64 = signatureBase64.replace(/^data:image\/png;base64,/, '');
        const signatureBytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));

        // Embed the signature image
        const signatureImage = await pdfDoc.embedPng(signatureBytes);

        // Get page dimensions for reference
        const { width: pageWidth, height: pageHeight } = signaturePage.getSize();
        console.log(`[Preview] Page dimensions: ${pageWidth} x ${pageHeight}`);

        // The signature canvas is 240px × 120px on screen.
        // The purchaser signature box in the OTP template is approximately 200pt × 70pt.
        // Scale factor: 200 PDF points / 240 canvas pixels ≈ 0.833
        const PDF_BOX_WIDTH = 200;
        const PDF_BOX_HEIGHT = 70;
        const CANVAS_WIDTH = 240;

        const scale = PDF_BOX_WIDTH / CANVAS_WIDTH;
        const signatureWidth = signatureImage.width * scale;
        const signatureHeight = signatureImage.height * scale;

        // Clamp to the box size so it never overflows
        const finalWidth = Math.min(signatureWidth, PDF_BOX_WIDTH);
        const finalHeight = Math.min(signatureHeight, PDF_BOX_HEIGHT);

        // Position signature in the PURCHASER'S SIGNATURE box (left column, bottom of page).
        // PDF coordinates: (0,0) is bottom-left; y is the BOTTOM edge of the drawn image.
        // A4 is 595 × 842 pt. The signature section is in the bottom ~25% of the page.
        // Left signature box: x ≈ 50pt, y ≈ 135pt from bottom (above the name line).
        const xPosition = 55;
        const yPosition = 135;

        console.log(`[Preview] Signature image: ${signatureImage.width}x${signatureImage.height}, scale: ${scale}, final: ${finalWidth}x${finalHeight}`);

        signaturePage.drawImage(signatureImage, {
            x: xPosition,
            y: yPosition,
            width: finalWidth,
            height: finalHeight,
        });

        // Save the signed PDF and return as base64
        const signedPdfBytes = await pdfDoc.save();
        const signedPdfBase64 = Buffer.from(signedPdfBytes).toString('base64');

        console.log(`[Preview] Signed PDF preview created, size: ${signedPdfBytes.length} bytes`);

        return NextResponse.json({
            success: true,
            signedPdfBase64
        });
    } catch (error) {
        console.error('[Preview] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
