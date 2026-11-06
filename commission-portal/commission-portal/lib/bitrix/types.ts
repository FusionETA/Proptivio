// Bitrix SPA Item structure
export interface BitrixItem {
    id: number;
    title?: string;
    assignedById?: number;
    createdTime?: string;
    updatedTime?: string;
    categoryId?: number;
    [key: string]: any; // For custom fields (ufCrm22_*)
}

// Transaction (categoryId: 42)
export interface BitrixTransaction extends BitrixItem {
    ufCrm22_1768766656894?: string; // Process Date
    ufCrm22_1768766664474?: string; // Transaction Date
    ufCrm22_1768766717249?: string; // Account No
    ufCrm22_1768766794874?: string; // Buyer Name
    ufCrm22_1768766825967?: string; // Project/Developer
    ufCrm22_1768766833832?: number; // Transaction Amount
    ufCrm22_1768766903332?: number; // Commission Rate
    ufCrm22_1768766910938?: number; // Commission Amount
    ufCrm22_1768766920678?: number; // Developer Rate
    ufCrm22_1768766975154?: number; // Developer Income
    ufCrm22_1768757229479?: string; // Approval Status
}

// Statement Record (categoryId: 46)
export interface BitrixStatementRecord extends BitrixItem {
    ufCrm22_1768766656894?: string; // Process Date
    ufCrm22_1768766664474?: string; // Transaction Date
    ufCrm22_1768766717249?: string; // Account No
    ufCrm22_1768766794874?: string; // Buyer Name
    ufCrm22_1768766825967?: string; // Project/Developer
    ufCrm22_1768766833832?: number; // Transaction Amount
    ufCrm22_1768766903332?: number; // Commission Rate
    ufCrm22_1768766910938?: number; // Commission Amount
    ufCrm22_1768757229479?: string; // Approval Status
}

// API Response wrapper
export interface BitrixListResponse<T> {
    items: T[];
    total: number;
    next?: number;
}
