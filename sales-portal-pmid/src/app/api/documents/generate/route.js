import { NextResponse } from 'next/server';
import { bitrix24 } from '@/lib/bitrix24';

export async function POST(request) {
    try {
        const { dealId, unitDetails } = await request.json();

        if (!dealId) {
            return NextResponse.json(
                { success: false, error: 'Deal ID is required' },
                { status: 400 }
            );
        }

        console.log(`[OTP] Generating OTP document for deal ${dealId}`);

        // Build template values from unit details
        const templateValues = {};
        if (unitDetails) {
            // Client details → {Value.ClientName}, {Value.ClientIC}, etc.
            if (unitDetails.clientName) templateValues.ClientName = unitDetails.clientName;
            if (unitDetails.clientIC) templateValues.ClientIC = unitDetails.clientIC;
            if (unitDetails.clientPhone) templateValues.ClientPhone = unitDetails.clientPhone;
            if (unitDetails.clientEmail) templateValues.ClientEmail = unitDetails.clientEmail;
            if (unitDetails.clientAddress) templateValues.ClientAddress = unitDetails.clientAddress;
            if (unitDetails.clientNationality) templateValues.ClientNationality = unitDetails.clientNationality;
            // Property details → {Value.ProjectName}, {Value.UnitName}, etc.
            if (unitDetails.projectName) templateValues.ProjectName = unitDetails.projectName;
            if (unitDetails.unitName) templateValues.UnitName = unitDetails.unitName;
            if (unitDetails.floor) templateValues.Floor = unitDetails.floor;
            if (unitDetails.type) templateValues.Type = unitDetails.type;
            if (unitDetails.sqft) templateValues.Sqft = unitDetails.sqft;
            if (unitDetails.unitPrice) templateValues.UnitPrice = Number(unitDetails.unitPrice).toLocaleString('en-MY', { minimumFractionDigits: 2 });
            // Payment details → {Value.BookingFee}, {Value.PaymentMode}, etc.
            if (unitDetails.bookingFee) templateValues.BookingFee = unitDetails.bookingFee;
            if (unitDetails.paymentMode) templateValues.PaymentMode = unitDetails.paymentMode;
            if (unitDetails.paymentRef) templateValues.PaymentRef = unitDetails.paymentRef;
            if (unitDetails.paymentDate) templateValues.PaymentDate = unitDetails.paymentDate;
            if (unitDetails.applicationFee) templateValues.ApplicationFee = unitDetails.applicationFee;
            if (unitDetails.remarks) templateValues.Remarks = unitDetails.remarks;
            // Auto-generated fields
            templateValues.OtpRef = `OTP-${dealId}`;
            templateValues.OtpDate = new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' });
            if (unitDetails.unitPrice) {
                const price = parseFloat(unitDetails.unitPrice) || 0;
                templateValues.DownPayment = (price * 0.1).toLocaleString('en-MY', { minimumFractionDigits: 2 });
            }
            console.log('[OTP] Template values:', templateValues);
        }

        // Step 1: If unitDetails has a unitId, temporarily swap the deal's product rows
        //         to show ONLY this unit in the generated OTP form.
        let originalProductRows = null;

        if (unitDetails?.unitId) {
            console.log(`[OTP] Swapping product rows to show only unit ${unitDetails.unitId} (${unitDetails.unitName})`);

            // Save the original product rows so we can restore them after generation
            const rowsRes = await bitrix24.getDealProductRows(dealId);
            originalProductRows = rowsRes.result || [];
            console.log(`[OTP] Saved ${originalProductRows.length} original product rows`);

            // Set product rows to only the current unit
            const singleUnitRow = [{
                PRODUCT_ID: unitDetails.unitId,
                QUANTITY: 1,
                PRICE: unitDetails.unitPrice || 0
            }];
            await bitrix24.addProductsToDeal(dealId, singleUnitRow);
            console.log(`[OTP] Product rows set to single unit: ${unitDetails.unitId}`);
        }

        // Step 2: Generate document from template with unit details
        // Use template 14 (OTP_GLDMARK) for Pantai Remis units, template 110 (FusionETA OTP) for others
        const templateId = unitDetails?.unitCategory === 'pantairemis' ? 14 : 110;
        let genResult;
        try {
            genResult = await bitrix24.generateOTPDocument(dealId, templateValues, templateId);
        } catch (genError) {
            // If generation fails, still restore product rows
            if (originalProductRows) {
                console.log('[OTP] Restoring original product rows after generation error...');
                await bitrix24.addProductsToDeal(dealId, originalProductRows.map(row => ({
                    PRODUCT_ID: row.PRODUCT_ID,
                    QUANTITY: row.QUANTITY,
                    PRICE: row.PRICE
                })));
            }
            throw genError;
        }

        // Step 3: Restore original product rows immediately after generation request
        if (originalProductRows) {
            console.log('[OTP] Restoring original product rows...');
            await bitrix24.addProductsToDeal(dealId, originalProductRows.map(row => ({
                PRODUCT_ID: row.PRODUCT_ID,
                QUANTITY: row.QUANTITY,
                PRICE: row.PRICE
            })));
            console.log('[OTP] Product rows restored');
        }

        const document = genResult.result?.document;

        if (!document || !document.id) {
            console.error('[OTP] Failed to generate document:', genResult);
            return NextResponse.json(
                { success: false, error: 'Failed to generate OTP document' },
                { status: 500 }
            );
        }

        const documentId = document.id;
        console.log(`[OTP] Document created with ID: ${documentId}`);

        // Step 4: Poll for PDF URL (generation is async, PDF may take a few seconds)
        let pdfUrl = document.pdfUrlMachine || document.pdfUrl;
        let attempts = 0;
        const maxAttempts = 10;

        while (!pdfUrl && attempts < maxAttempts) {
            attempts++;
            console.log(`[OTP] Waiting for PDF generation... attempt ${attempts}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

            const docResult = await bitrix24.getDocument(documentId);
            const docData = docResult.result?.document;

            if (docData) {
                pdfUrl = docData.pdfUrlMachine || docData.pdfUrl;

                // Check if there was a transformation error
                if (docData.isTransformationError) {
                    console.error('[OTP] PDF transformation error');
                    return NextResponse.json(
                        { success: false, error: 'PDF generation failed - transformation error' },
                        { status: 500 }
                    );
                }
            }
        }

        if (!pdfUrl) {
            console.error('[OTP] PDF URL not available after polling');
            return NextResponse.json(
                { success: false, error: 'PDF generation timed out. Please try again.' },
                { status: 500 }
            );
        }

        console.log(`[OTP] PDF URL ready: ${pdfUrl.substring(0, 80)}...`);

        return NextResponse.json({
            success: true,
            documentId,
            pdfUrl
        });
    } catch (error) {
        console.error('[OTP] Error generating document:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
