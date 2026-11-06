import { BITRIX_CONFIG } from './fieldMapping';

const WEBHOOK_URL = process.env.BITRIX24_WEBHOOK_URL || 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/';

class Bitrix24Service {
    /**
     * Make API call to Bitrix24
     */
    async callMethod(method, params = {}) {
        if (!WEBHOOK_URL) {
            console.error('BITRIX24_WEBHOOK_URL is not defined in environment variables');
            throw new Error('Bitrix24 configuration missing');
        }

        const url = `${WEBHOOK_URL}${method}`;
        console.log(`Calling Bitrix24 API: ${method}`);

        // Use JSON content type which is cleaner and less error-prone
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
            cache: 'no-store'
        });

        if (!response.ok) {
            // Log response text for debugging 400 errors
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error: ${response.statusText} - ${errorText}`);
        }

        return response.json();
    }

    /**
     * Retrieve all products (units) from Bitrix24
     */
    async getUnits(filters = {}) {
        const params = {
            order: { "ID": "ASC" },
            filter: { "ACTIVE": "Y", "SECTION_ID": 108 }, // ABC Soho section
            select: ["ID", "NAME", "PRICE", "CURRENCY_ID", "SECTION_ID", "PROPERTY_540", "PROPERTY_542", "PROPERTY_544"]
        };

        // Handle pagination
        let allUnits = [];
        let start = 0;
        let hasMore = true;

        while (hasMore) {
            params.start = start;
            const response = await this.callMethod('crm.product.list', params);

            if (response.result && response.result.length > 0) {
                allUnits = [...allUnits, ...response.result];
                start += 50;
                hasMore = response.next !== undefined;
            } else {
                hasMore = false;
            }
        }

        // Filter for MYR in memory
        const myrUnits = allUnits.filter(u => u.CURRENCY_ID === 'MYR');

        return this.transformUnitsData(myrUnits);
    }

    /**
     * Transform API response to frontend-friendly format
     * Derives unit attributes from product name: "A-05-01 (Type A)" → floor=5, type=A
     */
    transformUnitsData(rawUnits) {
        return rawUnits.map(unit => {
            // Parse floor/type from name e.g. "A-05-01 (Type A)" or "A-08-03 (Type B2)"
            const nameMatch = unit.NAME.match(/[A-Z]-(\d+)-\d+.*\(Type ([^)]+)\)/);
            const floor = nameMatch ? parseInt(nameMatch[1]).toString() : 'G';
            const type = nameMatch ? nameMatch[2] : 'Unit';

            return {
                id: unit.ID,
                name: unit.NAME,
                status: 'Available',
                viewOrientation: 'general',
                viewPosition: '',
                level: floor,
                type: type,
                sqft: unit.PROPERTY_540?.value ?? unit.PROPERTY_540 ?? '',
                bedrooms: unit.PROPERTY_542?.value ?? unit.PROPERTY_542 ?? '',
                bathrooms: unit.PROPERTY_544?.value ?? unit.PROPERTY_544 ?? '',
                price: unit.PRICE,
                currency: unit.CURRENCY_ID,
                unitCategory: 'soho',
                rawData: unit
            };
        });
    }

    /**
     * Retrieve Retail units from Bitrix24 catalog (section 110)
     */
    async getRetailUnits() {
        try {
            const productsParams = {
                order: { "ID": "ASC" },
                filter: { "ACTIVE": "Y", "SECTION_ID": 110 },
                select: ["ID", "NAME", "PRICE", "CURRENCY_ID", "SECTION_ID", "PROPERTY_540", "PROPERTY_542", "PROPERTY_544"],
                start: 0
            };

            let allProducts = [];
            let hasMore = true;

            while (hasMore) {
                const response = await this.callMethod('crm.product.list', productsParams);
                if (response.result && response.result.length > 0) {
                    allProducts = [...allProducts, ...response.result];
                    productsParams.start += 50;
                    hasMore = response.next !== undefined;
                } else {
                    hasMore = false;
                }
            }

            return allProducts.map(product => ({
                id: product.ID,
                name: product.NAME,
                status: 'Available',
                type: 'Retail',
                level: 'G',
                sqft: product.PROPERTY_540?.value ?? product.PROPERTY_540 ?? '',
                bedrooms: product.PROPERTY_542?.value ?? product.PROPERTY_542 ?? '',
                bathrooms: product.PROPERTY_544?.value ?? product.PROPERTY_544 ?? '',
                price: product.PRICE,
                currency: product.CURRENCY_ID,
                unitCategory: 'retail',
                viewOrientation: 'retail',
                rawData: product
            }));
        } catch (error) {
            console.error('[Retail] Error fetching retail units:', error);
            return [];
        }
    }

    /**
     * Pantai Remis not used in Proptivio — returns empty
     */
    async getPantaiRemisUnits() {
        return [];
    }

    // ---- LEGACY STUBS (kept for compatibility) ----
    transformRetailUnitsData() { return []; }
    transformPantaiRemisUnitsData() { return []; }
    determineViewOrientation() { return 'other'; }

    /**
     * Create contact in Bitrix24
     */
    async createContact(contactData) {
        const fields = {
            NAME: contactData.name,
            TYPE_ID: "CLIENT",
            EMAIL: [{ "VALUE": contactData.email, "VALUE_TYPE": "WORK" }],
            PHONE: [{ "VALUE": contactData.phone, "VALUE_TYPE": "MOBILE" }],
            ADDRESS: contactData.address,
            ADDRESS_COUNTRY: contactData.country,
            "UF_CRM_NATIONALITY": contactData.nationality
        };

        return this.callMethod('crm.contact.add', { fields });
    }

    /**
     * Get product details by ID
     * https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/crm.product.get
     */
    async getProduct(productId) {
        return this.callMethod('crm.product.get', { id: productId });
    }

    /**
     * Get product rows linked to a deal
     */
    async getDealProductRows(dealId) {
        return this.callMethod('crm.deal.productrows.get', { id: dealId });
    }

    /**
     * Link products to deal
     * https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/crm.deal.productrows.set
     */
    async addProductsToDeal(dealId, products) {
        return this.callMethod('crm.deal.productrows.set', {
            id: dealId,
            rows: products
        });
    }

    /**
     * Create deal in Bitrix24 with specific requirements
     */
    async createDeal(contactId, unitName, assignedById = null, dealExtra = {}) {
        // All units go to Sales & Booking pipeline (148), stage C148:NEW
        const fields = {
            TITLE: unitName,
            CATEGORY_ID: 148,
            STAGE_ID: 'C148:NEW',
            CONTACT_ID: contactId
        };

        if (assignedById) fields.ASSIGNED_BY_ID = assignedById;

        // Booking Payment Mode — enum IDs: 10370=Cash, 10372=Cheque, 10374=E-Transfer, 10376=Other
        if (dealExtra.bookingPaymentMode) fields.UF_CRM_BOOKING_PAYMENT_MODE = dealExtra.bookingPaymentMode;
        if (dealExtra.bookingFeeAmount)   fields.UF_CRM_BOOKING_FEE = dealExtra.bookingFeeAmount;
        if (dealExtra.paymentRefNo)       fields.UF_CRM_PAYMENT_REF_NO = dealExtra.paymentRefNo;
        if (dealExtra.applicationFee)     fields.UF_CRM_APPLICATION_FEE = dealExtra.applicationFee;
        if (dealExtra.paymentDate)        fields.UF_CRM_PAYMENT_DATE = dealExtra.paymentDate;
        // Project Name enum IDs: 10378=Gen Soho, 10380=Retail
        if (dealExtra.projectName)        fields.UF_CRM_PROJECT_NAME = dealExtra.projectName;
        if (dealExtra.remarks)            fields.UF_CRM_REMARKS = dealExtra.remarks;

        return this.callMethod('crm.deal.add', { fields });
    }

    /**
     * Batch create deals for multiple units
     * Updated logic: Single Deal containing Multiple Units
     */
    async createMultipleDeals(bookingData, units, assignedById = null, dealExtra = {}) {
        const results = [];

        try {
            // 1. Create Contact (Once)
            console.log(`[Booking] Creating contact for ${bookingData.name}`);
            const contactRes = await this.createContact(bookingData);
            const contactId = contactRes.result;

            if (!contactId) throw new Error("Failed to create contact");

            // 2. Create Deal (Once)
            const unitNames = units.map(u => u.name).join(', ');
            // Title: Unit1, Unit2 - ClientName
            const dealTitle = `${unitNames} - ${bookingData.name}`;
            console.log(`[Booking] Creating deal: ${dealTitle}`);

            const dealRes = await this.createDeal(contactId, dealTitle, assignedById, dealExtra);
            const dealId = dealRes.result;

            if (!dealId) throw new Error("Failed to create deal");

            // 3. Get Prices & Prep Product Rows
            const productRows = [];
            for (const unit of units) {
                console.log(`[Booking] Processing unit ${unit.id} (${unit.unitCategory})`);
                let price;

                // For retail units, use the price already in the unit object
                // For SOHO units, fetch from crm.product.get
                if (unit.unitCategory === 'retail') {
                    price = unit.price;
                    console.log(`[Booking] Using retail unit price: ${price}`);
                } else {
                    console.log(`[Booking] Fetching SOHO product price for ID: ${unit.id}`);
                    const productRes = await this.getProduct(unit.id);
                    price = productRes.result.PRICE;
                }

                if (!price && price !== 0) {
                    console.error(`[Booking] No price found for unit ${unit.id}, using fallback`);
                    price = unit.price || 0; // Fallback to unit.price
                }

                productRows.push({
                    PRODUCT_ID: unit.id,
                    QUANTITY: 1,
                    PRICE: price
                });
            }

            console.log(`[Booking] Product rows prepared:`, productRows);

            // 4. Link Products to Deal (Batch)
            console.log(`[Booking] Linking ${productRows.length} products to deal ${dealId}`);
            const linkRes = await this.addProductsToDeal(dealId, productRows);

            if (!linkRes.result) {
                console.error('[Booking] Failed to link products:', linkRes);
                throw new Error("Failed to link products to deal");
            }

            console.log('[Booking] Products linked successfully');

            // 5. Update Status for All Units  
            for (const unit of units) {
                try {
                    console.log(`[Booking] Updating product status to 'Booking' for ID: ${unit.id} (${unit.unitCategory})`);

                    // Use the same update method for both SOHO and Retail units
                    const statusRes = await this.updateProductStatus(unit.id, 220);
                    console.log(`[Booking] Status update result for ${unit.id}:`, JSON.stringify(statusRes, null, 2));

                    if (!statusRes.result) {
                        console.error(`[Booking] Failed to update status for unit ${unit.id}`, statusRes);
                        results.push({
                            unitId: unit.id,
                            unitName: unit.name,
                            success: true,
                            dealId: dealId,
                            contactId: contactId,
                            warning: "Status update failed"
                        });
                    } else {
                        console.log(`[Booking] ✅ Successfully updated status for unit ${unit.id}`);
                        results.push({
                            unitId: unit.id,
                            unitName: unit.name,
                            success: true,
                            dealId: dealId,
                            contactId: contactId
                        });
                    }
                } catch (statusError) {
                    console.error(`[Booking] ❌ Error updating status for unit ${unit.id}:`, statusError);
                    console.error(`[Booking] Error details:`, {
                        message: statusError.message,
                        stack: statusError.stack
                    });
                    results.push({
                        unitId: unit.id,
                        unitName: unit.name,
                        success: true, // Deal created
                        dealId: dealId,
                        contactId: contactId,
                        warning: "Status update failed: " + statusError.message
                    });
                }
            }

        } catch (error) {
            console.error('[Booking] Process failed:', error);
            // If the main flow (Contact -> Deal -> Link) fails, then ALL units fail.
            for (const unit of units) {
                results.push({
                    unitId: unit.id,
                    unitName: unit.name,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Update product status
     * https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/crm.product.update
     */
    async updateProductStatus(productId, statusId) {
        return this.callMethod('crm.product.update', {
            id: productId,
            fields: {
                PROPERTY_108: statusId
            }
        });
    }

    /**
     * Get deal form fields structure
     */
    async getDealFields() {
        return this.callMethod('crm.deal.fields');
    }

    /**
     * Generate OTP document from deal using a template
     * @param {number} dealId - Deal ID
     * @param {object} values - Additional template field values (e.g. ProductProperty_VIEW, iblockSection_NAME)
     * @param {number} templateId - Template ID (10 = OFFER TO PURCHASE FORM, 14 = OTP_GLDMARK DEVELOPMENT SDN BHD)
     */
    async generateOTPDocument(dealId, values = {}, templateId = 10) {
        const params = {
            templateId: templateId,
            entityTypeId: 2,
            entityId: dealId,
            stampsEnabled: 1
        };
        if (Object.keys(values).length > 0) {
            params.values = values;
        }
        return this.callMethod('crm.documentgenerator.document.add', params);
    }

    /**
     * Get document details (includes PDF download URLs)
     */
    async getDocument(documentId) {
        return this.callMethod('crm.documentgenerator.document.get', {
            id: documentId
        });
    }

    /**
     * Fetch PDF binary from a Bitrix24 machine URL
     */
    async fetchPdfFromUrl(pdfUrl) {
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error('Failed to fetch PDF from Bitrix24');
        return response.arrayBuffer();
    }

    /**
     * Save signature image to contact's Signature field (UF_CRM_1770622039424)
     */
    async saveSignatureToContact(contactId, signatureBase64) {
        const fileName = `signature_${contactId}_${Date.now()}.png`;
        return this.callMethod('crm.contact.update', {
            id: contactId,
            fields: {
                UF_CRM_1770622039424: {
                    fileData: [fileName, signatureBase64]
                }
            }
        });
    }

    /**
     * Upload signed PDF to deal's "Signed OTP Form" field (UF_CRM_1770622313871)
     * Appends to existing files so multiple signed OTPs can be stored.
     */
    async uploadSignedOTPToDeal(dealId, pdfBase64, unitName = '') {
        const label = unitName ? unitName.replace(/\s+/g, '_') : dealId;
        const fileName = `Signed_OTP_${label}_${Date.now()}.pdf`;
        return this.callMethod('crm.deal.update', {
            id: dealId,
            fields: {
                UF_CRM_1770622313871: {
                    fileData: [fileName, pdfBase64]
                }
            }
        });
    }

    /**
     * Upload Passport/IC attachment to deal (UF_CRM_1767343303673)
     */
    async uploadPassportICToDeal(dealId, fileBase64, fileName) {
        return this.callMethod('crm.deal.update', {
            id: dealId,
            fields: {
                UF_CRM_1767343303673: {
                    fileData: [fileName, fileBase64]
                }
            }
        });
    }

    /**
     * Upload Payment Receipt attachment to deal (UF_CRM_1770773374838)
     */
    async uploadPaymentReceiptToDeal(dealId, fileBase64, fileName) {
        return this.callMethod('crm.deal.update', {
            id: dealId,
            fields: {
                UF_CRM_1770773374838: {
                    fileData: [fileName, fileBase64]
                }
            }
        });
    }

    /**
     * Authenticate user by email
     * https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/user.get
     */
    async getUserByEmail(email) {
        return this.callMethod('user.get', {
            FILTER: { EMAIL: email },
            SELECT: ["ID", "EMAIL", "ACTIVE", "NAME", "LAST_NAME", "UF_*"]
        });
    }

    /**
     * Update user password field
     * https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/user.userfield.update
     */
    async updateUserPassword(userId, password) {
        return this.callMethod('user.userfield.update', {
            ID: userId,
            UF_USR_1769415163303: password
        });
    }

    /**
     * Get user info by ID
     */
    async getUserById(userId) {
        return this.callMethod('user.get', {
            ID: userId,
            SELECT: ["ID", "EMAIL", "ACTIVE", "NAME", "LAST_NAME", "UF_*"]
        });
    }
}

export const bitrix24 = new Bitrix24Service();
