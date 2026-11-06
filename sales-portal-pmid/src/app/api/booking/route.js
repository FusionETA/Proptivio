import { NextResponse } from 'next/server';
import { bitrix24 } from '@/lib/bitrix24';

export async function POST(request) {
    try {
        const body = await request.json();
        const { bookingData, unitIds, assignedById } = body;

        if (!bookingData || !unitIds || unitIds.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request data'
                },
                { status: 400 }
            );
        }

        // Get all units (SOHO, Retail, and Pantai Remis)
        console.log('[Booking API] Fetching all units...');
        const [sohoUnits, retailUnits, pantaiRemisUnits] = await Promise.all([
            bitrix24.getUnits(),
            bitrix24.getRetailUnits(),
            bitrix24.getPantaiRemisUnits()
        ]);
        const allUnits = [...sohoUnits, ...retailUnits, ...pantaiRemisUnits];

        console.log(`[Booking API] Total units available: ${allUnits.length} (SOHO: ${sohoUnits.length}, Retail: ${retailUnits.length}, PantaiRemis: ${pantaiRemisUnits.length})`);
        console.log(`[Booking API] Looking for unit IDs:`, unitIds);

        // Filter selected units
        const selectedUnits = allUnits.filter(unit =>
            unitIds.includes(unit.id)
        );

        console.log(`[Booking API] Found ${selectedUnits.length} selected units:`, selectedUnits.map(u => ({ id: u.id, name: u.name, category: u.unitCategory })));

        if (selectedUnits.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No matching units found. Please refresh and try again.'
                },
                { status: 400 }
            );
        }

        // Verify all units are available
        const unavailableUnits = selectedUnits.filter(
            unit => unit.status !== 'Available'
        );

        if (unavailableUnits.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Some units are no longer available',
                    unavailableUnits: unavailableUnits.map(u => u.name)
                },
                { status: 400 }
            );
        }

        // Extract file attachments from booking data (if present)
        const fileAttachments = bookingData.files || null;

        // Create deals
        // Map form data to Bitrix contact fields
        const contactPayload = {
            name: bookingData.clientName,
            email: bookingData.clientEmail,
            phone: bookingData.clientPhone,
            address: bookingData.clientAddress,
            country: bookingData.clientCountry,
            icNumber: bookingData.clientIC,
            nationality: bookingData.clientNationality
        };

        // Extra deal fields
        const dealExtra = {};
        if (bookingData.bookingPaymentMode) {
            dealExtra.bookingPaymentMode = bookingData.bookingPaymentMode;
        }
        if (bookingData.bookingFeeAmount) {
            dealExtra.bookingFeeAmount = bookingData.bookingFeeAmount;
        }
        if (bookingData.paymentRefNo) {
            dealExtra.paymentRefNo = bookingData.paymentRefNo;
        }
        if (bookingData.applicationFee) {
            dealExtra.applicationFee = bookingData.applicationFee;
        }
        if (bookingData.paymentDate) {
            dealExtra.paymentDate = bookingData.paymentDate;
        }
        if (bookingData.remarks) {
            dealExtra.remarks = bookingData.remarks;
        }

        // Set Project Name based on unit category (enum: 68=Retail, 70=GEN SOHO)
        // Pantai Remis goes to "Sales & Booking (Goldmark)" pipeline (category 16)
        const firstUnit = selectedUnits[0];
        if (firstUnit && firstUnit.unitCategory !== 'pantairemis') {
            dealExtra.projectName = firstUnit.unitCategory === 'retail' ? 68 : 70;
        } else if (firstUnit && firstUnit.unitCategory === 'pantairemis') {
            dealExtra.categoryId = 16;
        }

        const results = await bitrix24.createMultipleDeals(
            contactPayload,
            selectedUnits,
            assignedById, // Pass the logged-in user ID
            dealExtra
        );

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.length - successCount;

        // Extract dealId and contactId from the first successful result
        const firstSuccess = results.find(r => r.success);
        const dealId = firstSuccess?.dealId || null;
        const contactId = firstSuccess?.contactId || null;

        const paymentModeMap = { 10370: 'Cash', 10372: 'Cheque', 10374: 'E-Transfer', 10376: 'Other' };

        // Build unit details list for OTP form template values (one per unit)
        const unitDetailsList = selectedUnits.map(unit => ({
            unitId: unit.id,
            unitName: unit.name,
            unitPrice: unit.price || 0,
            unitCategory: unit.unitCategory,
            projectName: unit.unitCategory === 'retail' ? 'GEN 根  (Retail商鋪)' : unit.unitCategory === 'pantairemis' ? 'Pantai Remis' : 'GEN SOHO',
            view: unit.viewPosition || '',
            floor: unit.level || '',
            type: unit.type || '',
            sqft: unit.sqft || '',
            // Client details for OTP template
            clientName: bookingData.clientName || '',
            clientIC: bookingData.clientIC || '',
            clientPhone: bookingData.clientPhone || '',
            clientEmail: bookingData.clientEmail || '',
            clientAddress: bookingData.clientAddress || '',
            clientNationality: bookingData.clientNationality || '',
            // Payment details for OTP template
            bookingFee: bookingData.bookingFeeAmount || '',
            paymentMode: paymentModeMap[bookingData.bookingPaymentMode] || bookingData.bookingPaymentMode || '',
            paymentRef: bookingData.paymentRefNo || '',
            paymentDate: bookingData.paymentDate || '',
            applicationFee: bookingData.applicationFee || '',
            remarks: bookingData.remarks || '',
            contactId: contactId
        }));

        // Upload file attachments to deal if deal was created successfully
        if (dealId && fileAttachments) {
            try {
                // Upload Passport/IC
                if (fileAttachments.passportIC) {
                    console.log(`[Booking API] Uploading Passport/IC to deal ${dealId}`);
                    await bitrix24.uploadPassportICToDeal(
                        dealId,
                        fileAttachments.passportIC.base64,
                        fileAttachments.passportIC.fileName
                    );
                    console.log('[Booking API] Passport/IC uploaded successfully');
                }

                // Upload Payment Receipt
                if (fileAttachments.paymentReceipt) {
                    console.log(`[Booking API] Uploading Payment Receipt to deal ${dealId}`);
                    await bitrix24.uploadPaymentReceiptToDeal(
                        dealId,
                        fileAttachments.paymentReceipt.base64,
                        fileAttachments.paymentReceipt.fileName
                    );
                    console.log('[Booking API] Payment Receipt uploaded successfully');
                }
            } catch (fileError) {
                console.error('[Booking API] Error uploading file attachments:', fileError);
                // Don't fail the entire booking if file upload fails
                // The deal is already created successfully
            }
        }

        return NextResponse.json({
            success: failedCount === 0,
            results,
            dealId,
            contactId,
            unitDetailsList,
            summary: {
                total: results.length,
                successful: successCount,
                failed: failedCount
            }
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}
