// Frontend service to interact with Bitrix API routes

export interface TransactionData {
    id: number;
    title?: string;
    processDate?: string;
    transactionDate?: string;
    accountNo?: string;
    buyerName?: string;
    projectDeveloper?: string;
    transactionAmount?: number;
    commissionRate?: number;
    commissionAmount?: number;
    developerRate?: number;
    developerIncome?: number;
    approvalStatus?: string;
}

export interface StatementRecordData extends TransactionData {
    assignedById?: number;
}

export class BitrixService {
    // Fetch all transactions (for Overview page)
    async getTransactions(params?: {
        startDate?: string;
        endDate?: string;
        start?: number;
    }) {
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.set('startDate', params.startDate);
        if (params?.endDate) queryParams.set('endDate', params.endDate);
        if (params?.start) queryParams.set('start', params.start.toString());

        const response = await fetch(`/api/bitrix/transactions?${queryParams}`);
        return response.json();
    }

    // Fetch statement records (for Agent page)
    async getStatements(params?: {
        agentName?: string;
        accountNo?: string;
        start?: number;
    }) {
        const queryParams = new URLSearchParams();
        if (params?.agentName) queryParams.set('agentName', params.agentName);
        if (params?.accountNo) queryParams.set('accountNo', params.accountNo);
        if (params?.start) queryParams.set('start', params.start.toString());

        const response = await fetch(`/api/bitrix/statements?${queryParams}`);
        return response.json();
    }

    // Get single statement record
    async getStatement(id: number) {
        const response = await fetch(`/api/bitrix/statements/${id}`);
        return response.json();
    }

    // Approve statement record
    async approveStatement(id: number, processDate?: string) {
        const response = await fetch(`/api/bitrix/statements/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                approvalStatus: 'APPROVED',
                processDate: processDate || new Date().toISOString().split('T')[0],
            }),
        });
        return response.json();
    }

    // Update statement status (generic)
    async updateStatementStatus(id: number, status: string) {
        const response = await fetch(`/api/bitrix/statements/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                approvalStatus: status,
            }),
        });
        return response.json();
    }
}

export const bitrixService = new BitrixService();
