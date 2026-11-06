// Helper to map Bitrix field names to readable property names
export function mapBitrixItem(item: any) {
    return {
        id: item.id,
        title: item.title,
        assignedById: item.assignedById,
        createdTime: item.createdTime,
        updatedTime: item.updatedTime,

        // Transaction fields
        processDate: item.ufCrm22_1768766656894,
        transactionDate: item.ufCrm22_1768766664474,
        accountNo: item.ufCrm22_1768766679650,
        buyerName: item.ufCrm22_1768766697650,
        projectDeveloper: item.ufCrm22_1768766717249,
        transactionAmount: parseFloat(item.ufCrm22_1768766794874 || 0),
        commissionRate: parseFloat(item.ufCrm22_1768766825967 || 0),
        commissionAmount: parseFloat(item.ufCrm22_1768766833832 || 0),

        // Developer fields
        developerRate: parseFloat(item.ufCrm22_1768766852877 || 0),
        developerIncome: parseFloat(item.ufCrm22_1768766866722 || 0),
        developerPayableIncome: parseFloat(item.ufCrm22_1768766880346 || 0),

        // Agent fields
        agentRate: parseFloat(item.ufCrm22_1768766903332 || 0),
        agentIncome: parseFloat(item.ufCrm22_1768766910938 || 0),
        agentPayableIncome: parseFloat(item.ufCrm22_1768766920678 || 0),

        // Other fields
        dealId: item.ufCrm22_1768766962674,
        transactionRecordParent: item.ufCrm22_1768766975154,
        errorMessage: item.ufCrm22_1768766996931,

        // Statement Record specific
        income: parseFloat(item.ufCrm22_1768767232875 || 0),

        // Status
        approvalStatus: item.ufCrm22_1768757229479 || 'PENDING',

        // Agent info (from deal)
        agentId: item.agentId || '',
        agentName: item.agentName || '-',
        dealTitle: item.dealTitle || '',
    };
}

// Format currency
export function formatCurrency(amount: number | string | undefined) {
    if (!amount) return 'RM 0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `RM ${num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format date
export function formatDate(dateString: string | undefined) {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('en-MY');
    } catch {
        return dateString || '-';
    }
}
