export interface Transaction {
    id: string; // Deal ID
    processDate: string;
    transactionDate: string;
    accountNo: string;
    buyerName: string; // Customer
    developerName: string; // Project/Developer Name
    transactionAmount: number;
    commissionRate: number; // e.g., 2%
    commissionAmount: number;
    developerInfo: {
        rate: number;
        income: number;
        payableIncome: number;
    };
    agentInfo: {
        rate: number;
        income: number;
        payableIncome: number;
        name: string; // Added for portal view context
        id: string; // Agent ID
    };
    parentTransactionId?: string; // Transaction Record (Parent)
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    approvalDate?: string;
    errorMessage?: string;
}

export const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: "DEAL-001",
        processDate: "2024-03-15",
        transactionDate: "2024-03-10",
        accountNo: "ACC-8821",
        buyerName: "John Doe",
        developerName: "Skyline Residences",
        transactionAmount: 850000,
        commissionRate: 2.0,
        commissionAmount: 17000,
        developerInfo: {
            rate: 0.5,
            income: 8500,
            payableIncome: 8500,
        },
        agentInfo: {
            rate: 0.5,
            income: 8500,
            payableIncome: 8500,
            name: "Sarah Andrews",
            id: "AGT-001",
        },
        approvalStatus: "Approved",
        approvalDate: "2024-03-16",
    },
    {
        id: "DEAL-002",
        processDate: "2024-03-18",
        transactionDate: "2024-03-12",
        accountNo: "ACC-9932",
        buyerName: "Michael Tan",
        developerName: "Ocean View Park",
        transactionAmount: 1200000,
        commissionRate: 1.5,
        commissionAmount: 18000,
        developerInfo: {
            rate: 0.5,
            income: 9000,
            payableIncome: 9000,
        },
        agentInfo: {
            rate: 0.5,
            income: 9000,
            payableIncome: 9000,
            name: "James Lee",
            id: "AGT-002",
        },
        approvalStatus: "Pending",
    },
    {
        id: "DEAL-003",
        processDate: "2024-03-20",
        transactionDate: "2024-03-15",
        accountNo: "ACC-7712",
        buyerName: "Alice Wong",
        developerName: "Urban Heights",
        transactionAmount: 600000,
        commissionRate: 2.0,
        commissionAmount: 12000,
        developerInfo: {
            rate: 0.6,
            income: 7200,
            payableIncome: 7200,
        },
        agentInfo: {
            rate: 0.4,
            income: 4800,
            payableIncome: 4800,
            name: "Sarah Andrews",
            id: "AGT-001",
        },
        approvalStatus: "Approved",
        approvalDate: "2024-03-21",
    },
];
