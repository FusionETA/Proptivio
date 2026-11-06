// Filter utility functions
export function getAvailableYears(items: any[]): string[] {
    const years = new Set<string>();
    items.forEach((item) => {
        const date = item.transactionDate || item.processDate;
        if (date) {
            try {
                const year = new Date(date).getFullYear().toString();
                years.add(year);
            } catch (e) {
                // Skip invalid dates
            }
        }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)); // Most recent first
}

export function getAvailableMonths(): { value: string; label: string }[] {
    return [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];
}

export function getAvailableAgents(items: any[]): string[] {
    const agents = new Set<string>();
    items.forEach((item) => {
        const agentName = item.title || item.buyerName || item.accountNo;
        if (agentName && agentName !== 'Unknown') {
            agents.add(agentName);
        }
    });
    return Array.from(agents).sort();
}

export function filterByDate(
    items: any[],
    selectedYear: string,
    selectedMonth: string
): any[] {
    return items.filter((item) => {
        const date = item.transactionDate || item.processDate;
        if (!date) return false;

        try {
            const itemDate = new Date(date);
            const itemYear = itemDate.getFullYear().toString();
            const itemMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0');

            const yearMatch = selectedYear === 'all' || itemYear === selectedYear;
            const monthMatch = selectedMonth === 'all' || itemMonth === selectedMonth;

            return yearMatch && monthMatch;
        } catch (e) {
            return false;
        }
    });
}

export function filterByAgent(items: any[], selectedAgent: string): any[] {
    if (selectedAgent === 'all') return items;

    return items.filter((item) => {
        const agentName = item.title || item.buyerName || item.accountNo;
        return agentName === selectedAgent;
    });
}

export function applyFilters(
    items: any[],
    selectedYear: string,
    selectedMonth: string,
    selectedAgent: string
): any[] {
    let filtered = items;

    // Apply date filters
    filtered = filterByDate(filtered, selectedYear, selectedMonth);

    // Apply agent filter
    filtered = filterByAgent(filtered, selectedAgent);

    return filtered;
}
