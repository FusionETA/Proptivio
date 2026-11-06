// Commission Calculation and Trigger Service
import {
    COMMISSION_CONFIG,
    COMMISSION_FIELDS,
    CommissionStage,
    DealStageChangeEvent,
    CommissionRecord,
    RateSetting,
} from '@/lib/bitrix/commission-config';

// Product section to project name mapping
const SECTION_TO_PROJECT: Record<number, string> = {
    16: 'Gen Soho',
    52: 'Retail',
};

class CommissionService {
    private webhookUrl: string;
    private cachedRateSetting: RateSetting | null = null;

    constructor() {
        this.webhookUrl = COMMISSION_CONFIG.WEBHOOK_URL;
    }

    /**
     * Make a Bitrix24 API call
     */
    private async callBitrix(method: string, params: Record<string, any> = {}) {
        const url = `${this.webhookUrl}/${method}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error_description || data.error);
        }

        return data.result;
    }

    /**
     * Get contact details by ID
     */
    async getContact(contactId: number): Promise<any> {
        return this.callBitrix('crm.contact.get', { id: contactId });
    }

    /**
     * Get client name from contact
     */
    async getClientName(contactId: number): Promise<string> {
        try {
            const contact = await this.getContact(contactId);
            if (contact) {
                // Build full name from NAME, SECOND_NAME, LAST_NAME
                const parts = [contact.NAME, contact.SECOND_NAME, contact.LAST_NAME].filter(Boolean);
                return parts.join(' ') || contact.NAME || '';
            }
        } catch (error) {
            console.error('Failed to get contact:', error);
        }
        return '';
    }

    /**
     * Get product by name (matching unit title)
     */
    async getProductByName(productName: string): Promise<any | null> {
        try {
            const result = await this.callBitrix('crm.product.list', {
                filter: { NAME: productName },
            });
            if (result && result.length > 0) {
                return result[0];
            }
        } catch (error) {
            console.error('Failed to get product:', error);
        }
        return null;
    }

    /**
     * Get project name from product section
     */
    async getProjectFromProduct(productName: string): Promise<string> {
        const product = await this.getProductByName(productName);
        if (product && product.SECTION_ID) {
            const sectionId = parseInt(product.SECTION_ID);
            return SECTION_TO_PROJECT[sectionId] || '';
        }
        return '';
    }

    /**
     * Get rate settings from Rate Setting pipeline
     */
    async getRateSettings(): Promise<RateSetting | null> {
        const result = await this.callBitrix('crm.item.list', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            filter: {
                categoryId: COMMISSION_CONFIG.CATEGORIES.RATE_SETTING,
            },
            select: [
                'id',
                'title',
                COMMISSION_FIELDS.DEVELOPER_RATE,
                COMMISSION_FIELDS.AGENT_RATE,
                COMMISSION_FIELDS.COMMISSION_RATE,
            ],
            order: { id: 'DESC' },
            limit: 1,
        });

        if (result.items && result.items.length > 0) {
            const item = result.items[0];
            return {
                id: item.id,
                title: item.title,
                developerRate: parseFloat(item[COMMISSION_FIELDS.DEVELOPER_RATE]) || 0.5,
                agentRate: parseFloat(item[COMMISSION_FIELDS.AGENT_RATE]) || 0.5,
                commissionRate: item[COMMISSION_FIELDS.COMMISSION_RATE]
                    ? parseFloat(item[COMMISSION_FIELDS.COMMISSION_RATE]) / 100
                    : undefined,
            };
        }

        // Default rate setting if none found
        return {
            id: 0,
            title: 'Default',
            developerRate: 0.5,
            agentRate: 0.5,
        };
    }

    /**
     * Get all rate settings from Rate Setting pipeline
     */
    async getAllRateSettings(): Promise<RateSetting[]> {
        const result = await this.callBitrix('crm.item.list', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            filter: {
                categoryId: COMMISSION_CONFIG.CATEGORIES.RATE_SETTING,
            },
            select: [
                'id',
                'title',
                COMMISSION_FIELDS.DEVELOPER_RATE,
                COMMISSION_FIELDS.AGENT_RATE,
                COMMISSION_FIELDS.COMMISSION_RATE,
            ],
            order: { id: 'DESC' },
        });

        if (result.items && result.items.length > 0) {
            return result.items.map((item: any) => ({
                id: item.id,
                title: item.title,
                developerRate: parseFloat(item[COMMISSION_FIELDS.DEVELOPER_RATE]) || 0.5,
                agentRate: parseFloat(item[COMMISSION_FIELDS.AGENT_RATE]) || 0.5,
                commissionRate: item[COMMISSION_FIELDS.COMMISSION_RATE]
                    ? parseFloat(item[COMMISSION_FIELDS.COMMISSION_RATE]) / 100
                    : undefined,
            }));
        }

        return [];
    }

    /**
     * Create or update rate setting
     */
    async saveRateSetting(setting: Partial<RateSetting>): Promise<any> {
        const fields = {
            title: setting.title || 'Rate Setting',
            categoryId: COMMISSION_CONFIG.CATEGORIES.RATE_SETTING,
            [COMMISSION_FIELDS.DEVELOPER_RATE]: String(setting.developerRate || 0.5),
            [COMMISSION_FIELDS.AGENT_RATE]: String(setting.agentRate || 0.5),
        };

        if (setting.commissionRate !== undefined) {
            (fields as any)[COMMISSION_FIELDS.COMMISSION_RATE] = String(setting.commissionRate * 100);
        }

        if (setting.id) {
            return this.callBitrix('crm.item.update', {
                entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
                id: setting.id,
                fields,
            });
        }

        return this.callBitrix('crm.item.add', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            fields,
        });
    }

    /**
     * Check if a stage is a commission-triggering stage
     */
    isCommissionStage(stageId: string): boolean {
        return stageId in COMMISSION_CONFIG.STAGES;
    }

    /**
     * Get commission configuration for a stage
     */
    getStageConfig(stageId: string): CommissionStage | null {
        return COMMISSION_CONFIG.STAGES[stageId as keyof typeof COMMISSION_CONFIG.STAGES] || null;
    }

    /**
     * Get all stages up to and including the current stage
     * This enables stacking commissions (e.g., if at stage 3, get stages 1, 2, 3)
     */
    getStagesUpTo(currentStageId: string): CommissionStage[] {
        const currentConfig = this.getStageConfig(currentStageId);
        if (!currentConfig) return [];

        const stages: CommissionStage[] = [];
        for (const [stageId, config] of Object.entries(COMMISSION_CONFIG.STAGES)) {
            if (config.stageNumber <= currentConfig.stageNumber) {
                stages.push({ ...config, stageId } as CommissionStage & { stageId: string });
            }
        }
        return stages.sort((a, b) => a.stageNumber - b.stageNumber);
    }

    /**
     * Calculate commission amount based on transaction amount and rate
     */
    calculateCommission(transactionAmount: number, rate: number): number {
        return Math.round(transactionAmount * rate * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Get deal details from Bitrix24
     */
    async getDeal(dealId: number): Promise<any> {
        return this.callBitrix('crm.deal.get', { id: dealId });
    }

    /**
     * Check if commission already exists for this deal and stage (by stage name in title)
     */
    async checkExistingCommissionByStageName(dealId: number, stageName: string): Promise<boolean> {
        const result = await this.callBitrix('crm.item.list', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            filter: {
                categoryId: COMMISSION_CONFIG.CATEGORIES.TRANSACTION,
                [COMMISSION_FIELDS.DEAL_ID]: String(dealId),
                '%title': `Commission - ${stageName}`,
            },
        });

        return result.items && result.items.length > 0;
    }

    /**
     * Check if commission already exists for this deal and stage
     */
    async checkExistingCommission(dealId: number, stageId: string): Promise<boolean> {
        const stageConfig = this.getStageConfig(stageId);
        if (!stageConfig) return false;

        return this.checkExistingCommissionByStageName(dealId, stageConfig.name);
    }

    /**
     * Create a commission record in Proptivio Commission SPA (Transaction pipeline)
     */
    async createCommissionRecord(record: CommissionRecord): Promise<any> {
        const today = new Date().toISOString().split('T')[0];

        // Get rate settings for developer/agent split
        const rateSetting = await this.getRateSettings();

        // Calculate developer and agent income based on rate settings
        const developerIncome = this.calculateCommission(
            record.commissionAmount,
            rateSetting?.developerRate || 0.5
        );
        const agentIncome = this.calculateCommission(
            record.commissionAmount,
            rateSetting?.agentRate || 0.5
        );

        const fields = {
            title: `Commission - ${record.stageName} - Deal #${record.dealId}`,
            categoryId: COMMISSION_CONFIG.CATEGORIES.TRANSACTION,
            [COMMISSION_FIELDS.DEAL_ID]: String(record.dealId),
            [COMMISSION_FIELDS.TRANSACTION_DATE]: record.transactionDate || today,
            [COMMISSION_FIELDS.PROCESS_DATE]: today,
            [COMMISSION_FIELDS.TRANSACTION_AMOUNT]: String(record.transactionAmount),
            [COMMISSION_FIELDS.COMMISSION_RATE]: String(record.commissionRate * 100),
            [COMMISSION_FIELDS.COMMISSION_AMOUNT]: String(record.commissionAmount),
            [COMMISSION_FIELDS.BUYER_NAME]: record.buyerName || '',
            [COMMISSION_FIELDS.PROJECT_DEVELOPER]: record.projectName || '',
            [COMMISSION_FIELDS.DEVELOPER_RATE]: String((rateSetting?.developerRate || 0.5) * 100),
            [COMMISSION_FIELDS.DEVELOPER_INCOME]: String(developerIncome),
            [COMMISSION_FIELDS.AGENT_RATE]: String((rateSetting?.agentRate || 0.5) * 100),
            [COMMISSION_FIELDS.AGENT_INCOME]: String(agentIncome),
            [COMMISSION_FIELDS.APPROVAL_STATUS]: 'PENDING',
        };

        return this.callBitrix('crm.item.add', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            fields,
        });
    }

    /**
     * Process a deal stage change event and create stacked commissions
     * Creates commission records for all stages up to current stage that don't exist yet
     */
    async processStageChange(event: DealStageChangeEvent): Promise<{
        success: boolean;
        message: string;
        commissions?: CommissionRecord[];
    }> {
        // Check if this is the Progressive Billing pipeline
        if (event.categoryId !== COMMISSION_CONFIG.PIPELINE_ID) {
            return {
                success: false,
                message: `Deal is not in Progressive Billing pipeline (category ${event.categoryId})`,
            };
        }

        // Check if this stage triggers commission
        if (!this.isCommissionStage(event.stageId)) {
            return {
                success: false,
                message: `Stage ${event.stageId} does not trigger commission`,
            };
        }

        // Get deal details
        let dealDetails: any = null;
        let clientName = '';
        let projectName = '';

        try {
            dealDetails = await this.getDeal(event.dealId);

            // Get client name from contact
            if (dealDetails.CONTACT_ID) {
                clientName = await this.getClientName(parseInt(dealDetails.CONTACT_ID));
            }

            // Get project name from product (matching deal title to product name)
            projectName = await this.getProjectFromProduct(dealDetails.TITLE);
        } catch (error) {
            console.error('Failed to get deal details:', error);
        }

        // Get rate settings for developer/agent split
        const rateSetting = await this.getRateSettings();

        // Get all stages up to current stage for stacking
        const stagesToProcess = this.getStagesUpTo(event.stageId);
        const createdCommissions: CommissionRecord[] = [];
        const skippedStages: string[] = [];

        for (const stageConfig of stagesToProcess) {
            // Check if commission already exists for this stage (by stage name)
            const exists = await this.checkExistingCommissionByStageName(event.dealId, stageConfig.name);
            if (exists) {
                skippedStages.push(stageConfig.name);
                continue;
            }

            // Calculate commission for this stage
            const commissionAmount = this.calculateCommission(event.opportunity, stageConfig.rate);

            // Create commission record
            const commissionRecord: CommissionRecord = {
                dealId: event.dealId,
                stageId: event.stageId,
                stageName: stageConfig.name,
                stageNumber: stageConfig.stageNumber,
                transactionAmount: event.opportunity,
                commissionRate: stageConfig.rate,
                commissionAmount,
                transactionDate: new Date().toISOString().split('T')[0],
                buyerName: clientName,
                projectName: projectName,
                developerRate: rateSetting?.developerRate,
                developerIncome: this.calculateCommission(commissionAmount, rateSetting?.developerRate || 0.5),
                agentRate: rateSetting?.agentRate,
                agentIncome: this.calculateCommission(commissionAmount, rateSetting?.agentRate || 0.5),
            };

            try {
                await this.createCommissionRecord(commissionRecord);
                createdCommissions.push(commissionRecord);
            } catch (error) {
                console.error(`Failed to create commission for stage ${stageConfig.name}:`, error);
            }
        }

        if (createdCommissions.length === 0) {
            return {
                success: false,
                message: `All commission stages already exist for deal ${event.dealId}. Skipped: ${skippedStages.join(', ')}`,
            };
        }

        const totalCommission = createdCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const stageNames = createdCommissions.map(c => `${c.stageName} (${c.commissionRate * 100}%)`).join(', ');

        return {
            success: true,
            message: `Created ${createdCommissions.length} commission(s): ${stageNames}. Total: RM ${totalCommission.toFixed(2)}${skippedStages.length > 0 ? `. Skipped existing: ${skippedStages.join(', ')}` : ''}`,
            commissions: createdCommissions,
        };
    }

    /**
     * Get all deals in Progressive Billing pipeline at commission stages
     */
    async getDealsAtCommissionStages(): Promise<any[]> {
        const commissionStageIds = Object.keys(COMMISSION_CONFIG.STAGES);

        const result = await this.callBitrix('crm.deal.list', {
            filter: {
                CATEGORY_ID: COMMISSION_CONFIG.PIPELINE_ID,
                STAGE_ID: commissionStageIds,
            },
            select: [
                'ID',
                'TITLE',
                'STAGE_ID',
                'OPPORTUNITY',
                'CURRENCY_ID',
                'CONTACT_ID',
                'COMPANY_ID',
                'ASSIGNED_BY_ID',
                'DATE_CREATE',
            ],
        });

        return result || [];
    }

    /**
     * Process all deals currently at commission stages (for batch processing)
     */
    async processBatchCommissions(): Promise<{
        processed: number;
        created: number;
        skipped: number;
        errors: number;
        results: Array<{ dealId: number; result: any }>;
    }> {
        const deals = await this.getDealsAtCommissionStages();
        const results: Array<{ dealId: number; result: any }> = [];

        let processed = 0;
        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const deal of deals) {
            processed++;

            const event: DealStageChangeEvent = {
                dealId: parseInt(deal.ID),
                stageId: deal.STAGE_ID,
                categoryId: COMMISSION_CONFIG.PIPELINE_ID,
                opportunity: parseFloat(deal.OPPORTUNITY) || 0,
                title: deal.TITLE,
                contactId: deal.CONTACT_ID ? parseInt(deal.CONTACT_ID) : undefined,
                companyId: deal.COMPANY_ID ? parseInt(deal.COMPANY_ID) : undefined,
                assignedById: deal.ASSIGNED_BY_ID ? parseInt(deal.ASSIGNED_BY_ID) : undefined,
            };

            try {
                const result = await this.processStageChange(event);
                results.push({ dealId: event.dealId, result });

                if (result.success && result.commissions) {
                    created += result.commissions.length;
                } else {
                    skipped++;
                }
            } catch (error) {
                errors++;
                results.push({
                    dealId: event.dealId,
                    result: {
                        success: false,
                        message: error instanceof Error ? error.message : 'Unknown error',
                    },
                });
            }
        }

        return { processed, created, skipped, errors, results };
    }

    /**
     * Get commission summary for a deal
     */
    async getDealCommissions(dealId: number): Promise<any[]> {
        const result = await this.callBitrix('crm.item.list', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            filter: {
                categoryId: COMMISSION_CONFIG.CATEGORIES.TRANSACTION,
                [COMMISSION_FIELDS.DEAL_ID]: String(dealId),
            },
            select: [
                'id',
                'title',
                COMMISSION_FIELDS.TRANSACTION_DATE,
                COMMISSION_FIELDS.TRANSACTION_AMOUNT,
                COMMISSION_FIELDS.COMMISSION_RATE,
                COMMISSION_FIELDS.COMMISSION_AMOUNT,
                COMMISSION_FIELDS.DEVELOPER_RATE,
                COMMISSION_FIELDS.DEVELOPER_INCOME,
                COMMISSION_FIELDS.AGENT_RATE,
                COMMISSION_FIELDS.AGENT_INCOME,
                COMMISSION_FIELDS.APPROVAL_STATUS,
                COMMISSION_FIELDS.BUYER_NAME,
                COMMISSION_FIELDS.PROJECT_DEVELOPER,
            ],
        });

        return result.items || [];
    }

    /**
     * Get all transactions from Transaction pipeline
     */
    async getTransactions(filter: Record<string, any> = {}): Promise<any[]> {
        const result = await this.callBitrix('crm.item.list', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            filter: {
                categoryId: COMMISSION_CONFIG.CATEGORIES.TRANSACTION,
                ...filter,
            },
            order: { id: 'DESC' },
        });

        return result.items || [];
    }

    /**
     * Get all statement records from Statement Record pipeline
     */
    async getStatementRecords(filter: Record<string, any> = {}): Promise<any[]> {
        const result = await this.callBitrix('crm.item.list', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            filter: {
                categoryId: COMMISSION_CONFIG.CATEGORIES.STATEMENT_RECORD,
                ...filter,
            },
            order: { id: 'DESC' },
        });

        return result.items || [];
    }

    /**
     * Get all approval records from Approval pipeline
     */
    async getApprovals(filter: Record<string, any> = {}): Promise<any[]> {
        const result = await this.callBitrix('crm.item.list', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            filter: {
                categoryId: COMMISSION_CONFIG.CATEGORIES.APPROVAL,
                ...filter,
            },
            order: { id: 'DESC' },
        });

        return result.items || [];
    }

    /**
     * Create a statement record
     */
    async createStatementRecord(data: {
        title: string;
        transactionIds: string[];
        totalAmount: number;
        assignedById?: number;
    }): Promise<any> {
        const today = new Date().toISOString().split('T')[0];

        const fields = {
            title: data.title,
            categoryId: COMMISSION_CONFIG.CATEGORIES.STATEMENT_RECORD,
            [COMMISSION_FIELDS.PROCESS_DATE]: today,
            [COMMISSION_FIELDS.INCOME]: String(data.totalAmount),
            [COMMISSION_FIELDS.STATEMENT_RECORD_CHILD]: data.transactionIds,
        };

        if (data.assignedById) {
            (fields as any)[COMMISSION_FIELDS.ASSIGNED_BY_ID] = data.assignedById;
        }

        return this.callBitrix('crm.item.add', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            fields,
        });
    }

    /**
     * Create an approval record
     */
    async createApprovalRecord(data: {
        title: string;
        statementRecordId: string;
        status?: string;
        assignedById?: number;
    }): Promise<any> {
        const today = new Date().toISOString().split('T')[0];

        const fields = {
            title: data.title,
            categoryId: COMMISSION_CONFIG.CATEGORIES.APPROVAL,
            [COMMISSION_FIELDS.PROCESS_DATE]: today,
            [COMMISSION_FIELDS.TRANSACTION_RECORD_PARENT]: data.statementRecordId,
            [COMMISSION_FIELDS.APPROVAL_STATUS]: data.status || 'PENDING',
        };

        if (data.assignedById) {
            (fields as any)[COMMISSION_FIELDS.ASSIGNED_BY_ID] = data.assignedById;
        }

        return this.callBitrix('crm.item.add', {
            entityTypeId: COMMISSION_CONFIG.COMMISSION_ENTITY_TYPE_ID,
            fields,
        });
    }
}

export const commissionService = new CommissionService();
