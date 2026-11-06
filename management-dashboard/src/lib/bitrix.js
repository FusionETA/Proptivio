
import {
    BITRIX_URL,
    PIPELINES,
    PRODUCT_SECTIONS,
    SOLD_DEFINITIONS,
    NATIONALITY_FIELD_ID,
    CONSTRUCTION_PIPELINE_ID,
    LOA_ENTITY_TYPE,
    VO_ENTITY_TYPE,
    CLAIM_ENTITY_TYPE,
    LOA_FIELDS,
    VO_FIELDS,
    CLAIM_FIELDS,
    PROGRESSIVE_BILLING_PIPELINE_ID,
    BILLING_MILESTONE_ORDER,
    BILLING_STAGE_LABELS,
    SALES_DEAL_FIELDS,
    BILLING_DEAL_FIELDS
} from './constants';

// Basic Bitrix24 API fetch helper
async function bitrixFetch(method, params = {}) {
    const url = new URL(`${BITRIX_URL}${method}`);
    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((v, i) => url.searchParams.append(`${key}[${i}]`, v));
        } else if (typeof value === 'object') {
            Object.entries(value).forEach(([k, v]) => url.searchParams.append(`${key}[${k}]`, v));
        } else {
            url.searchParams.append(key, value);
        }
    });

    const response = await fetch(url.toString(), { cache: 'no-store' });
    const data = await response.json();
    if (data.error) throw new Error(data.error_description);
    return data;
}

// Fetch all items with pagination
async function fetchAllItems(method, params = {}) {
    let allItems = [];
    let start = 0;

    while (true) {
        const data = await bitrixFetch(method, { ...params, start });
        allItems = allItems.concat(data.result);
        if (!data.next) break;
        start = data.next;
    }

    return allItems;
}

// Fetch all CRM items with pagination (for crm.item.list which returns result.items)
async function fetchAllCrmItems(params = {}) {
    let allItems = [];
    let start = 0;

    while (true) {
        const data = await bitrixFetch('crm.item.list', { ...params, start });
        // crm.item.list returns data in result.items instead of result
        allItems = allItems.concat(data.result.items || []);
        if (!data.next) break;
        start = data.next;
    }

    return allItems;
}

// Get all products from a section
async function getProductsBySection(sectionId) {
    return fetchAllItems('crm.product.list', { 'filter[SECTION_ID]': sectionId });
}

// Get Nationality Enum Mapping
async function getNationalityMapping() {
    try {
        const response = await bitrixFetch('crm.contact.userfield.list', {
            'filter[FIELD_NAME]': NATIONALITY_FIELD_ID
        });

        const field = response.result.find(f => f.FIELD_NAME === NATIONALITY_FIELD_ID);
        if (!field || !field.LIST) return {};

        const map = {};
        field.LIST.forEach(item => {
            map[item.ID] = item.VALUE;
        });
        return map;
    } catch (e) {
        console.error("Failed to fetch nationality mapping:", e);
        return {};
    }
}

// Fetch contacts by IDs
async function getContacts(contactIds) {
    if (!contactIds || contactIds.length === 0) return {};
    const uniqueIds = [...new Set(contactIds)];

    // Fetch in batches (Bitrix might have URL length limits, but simple list for now)
    // Using crm.contact.list filtering by ID
    const contacts = await fetchAllItems('crm.contact.list', {
        'filter[ID]': uniqueIds,
        'select': ['ID', 'NAME', 'LAST_NAME', NATIONALITY_FIELD_ID]
    });

    return contacts;
}

// Get all deals from Sales & Booking pipeline with product rows
async function getSalesDealsWithProducts() {
    const deals = await fetchAllItems('crm.deal.list', {
        'filter[CATEGORY_ID]': PIPELINES.SALES_BOOKING,
        'select': ['*', 'CONTACT_ID'] // Ensure CONTACT_ID is selected
    });

    // Get product rows for each deal
    const dealsWithProducts = await Promise.all(deals.map(async (deal) => {
        try {
            const productsData = await bitrixFetch('crm.deal.productrows.get', { id: deal.ID });
            return {
                ...deal,
                products: productsData.result || []
            };
        } catch (e) {
            return { ...deal, products: [] };
        }
    }));

    return dealsWithProducts;
}

// Main dashboard data function
export async function getDashboardData() {
    // Fetch all data in parallel
    const [genSohoProducts, retailProducts, salesDeals, nationalityMap] = await Promise.all([
        getProductsBySection(PRODUCT_SECTIONS.GEN_SOHO),
        getProductsBySection(PRODUCT_SECTIONS.RETAIL),
        getSalesDealsWithProducts(),
        getNationalityMapping()
    ]);

    // Create product ID to section mapping
    const productSectionMap = {};
    genSohoProducts.forEach(p => { productSectionMap[p.ID] = 'GEN_SOHO'; });
    retailProducts.forEach(p => { productSectionMap[p.ID] = 'RETAIL'; });

    // Extract all contact IDs
    const contactIds = salesDeals.map(d => d.CONTACT_ID).filter(id => id);
    const contactsData = await getContacts(contactIds);

    // Create contact map with resolved nationality
    const contactMap = {};
    contactsData.forEach(c => {
        const rawNat = c[NATIONALITY_FIELD_ID];
        const fullName = [c.NAME, c.LAST_NAME]
            .filter(part => part && part !== 'null' && part !== 'undefined')
            .join(' ')
            .trim();

        contactMap[c.ID] = {
            name: fullName || 'Unknown',
            nationality: nationalityMap[rawNat] || rawNat || 'Unknown'
        };
    });

    // Process sales deals - extract units with section info
    const soldUnits = [];
    salesDeals.forEach(deal => {
        const contact = contactMap[deal.CONTACT_ID] || { name: 'Unknown', nationality: 'Unknown' };
        deal.products.forEach(product => {
            const section = productSectionMap[product.PRODUCT_ID] ||
                (product.PRODUCT_NAME?.includes('RT') ? 'RETAIL' : 'GEN_SOHO');
            soldUnits.push({
                dealId: deal.ID,
                dealTitle: deal.TITLE,
                stageId: deal.STAGE_ID,
                productId: product.PRODUCT_ID,
                productName: product.PRODUCT_NAME,
                price: parseFloat(product.PRICE) || 0,
                section: section,
                purchaserName: contact.name,
                nationality: contact.nationality
            });
        });
    });

    // Calculate totals
    const genSohoTotal = {
        qty: genSohoProducts.length,
        value: genSohoProducts.reduce((sum, p) => sum + parseFloat(p.PRICE || 0), 0)
    };

    const retailTotal = {
        qty: retailProducts.length,
        value: retailProducts.reduce((sum, p) => sum + parseFloat(p.PRICE || 0), 0)
    };

    return {
        products: {
            genSoho: genSohoProducts,
            retail: retailProducts,
            totals: { genSoho: genSohoTotal, retail: retailTotal }
        },
        soldUnits,
        productSectionMap,
        nationalityMap // Return full map for dropdown
    };
}

// Helper to check if a deal/unit is "sold" based on toggle
export function isSold(stageId, toggleMode) {
    const validStages = SOLD_DEFINITIONS[toggleMode] || [];
    return validStages.includes(stageId);
}

// ============= Construction Cost Functions =============

// Get all construction milestones
async function getConstructionMilestones() {
    return fetchAllItems('crm.deal.list', {
        'filter[CATEGORY_ID]': CONSTRUCTION_PIPELINE_ID
    });
}

// Get all LOAs with their budget
async function getAllLOAs() {
    return fetchAllCrmItems({
        entityTypeId: LOA_ENTITY_TYPE
    });
}

// Get all claims
async function getAllClaims() {
    return fetchAllCrmItems({
        entityTypeId: CLAIM_ENTITY_TYPE
    });
}

// Get all variation orders
async function getAllVOs() {
    return fetchAllCrmItems({
        entityTypeId: VO_ENTITY_TYPE
    });
}

// Aggregate construction cost data
export async function getConstructionCostData() {
    const [milestones, loas, vos, claims] = await Promise.all([
        getConstructionMilestones(),
        getAllLOAs(),
        getAllVOs(),
        getAllClaims()
    ]);

    // Group LOAs by milestone
    const loasByMilestone = {};
    loas.forEach(loa => {
        const milestoneId = loa[LOA_FIELDS.PARENT_MILESTONE];
        if (milestoneId) {
            if (!loasByMilestone[milestoneId]) {
                loasByMilestone[milestoneId] = [];
            }
            loasByMilestone[milestoneId].push(loa);
        }
    });

    // Group VOs by LOA
    const vosByLOA = {};
    vos.forEach(vo => {
        const loaId = vo[VO_FIELDS.PARENT_LOA];
        if (loaId) {
            if (!vosByLOA[loaId]) {
                vosByLOA[loaId] = [];
            }
            vosByLOA[loaId].push(vo);
        }
    });

    // Group claims by LOA
    const claimsByLOA = {};
    claims.forEach(claim => {
        const loaId = claim[CLAIM_FIELDS.PARENT_LOA];
        if (loaId) {
            if (!claimsByLOA[loaId]) {
                claimsByLOA[loaId] = [];
            }
            claimsByLOA[loaId].push(claim);
        }
    });

    // Calculate totals for each milestone
    const milestoneData = milestones.map(milestone => {
        const milestoneLOAs = loasByMilestone[milestone.ID] || [];

        let plannedBudget = 0;
        let actualSpent = 0;

        milestoneLOAs.forEach(loa => {
            // Base LOA amount
            const baseAmount = parseFloat(loa.opportunity || 0);

            // Sum all VOs for this LOA, treating omissions as negative
            const loaVOs = vosByLOA[loa.id] || [];
            const voAmount = loaVOs.reduce((sum, vo) => {
                const amount = parseFloat(vo.opportunity || 0);
                const isOmit = vo[VO_FIELDS.VO_TYPE] === 90; // 90 = Omit (number)
                return sum + (isOmit ? -amount : amount);
            }, 0);

            const totalBudget = baseAmount + voAmount;

            plannedBudget += totalBudget;

            // Actual = Sum of all claims for this LOA
            const loaClaims = claimsByLOA[loa.id] || [];
            loaClaims.forEach(claim => {
                const amount = parseFloat(claim[CLAIM_FIELDS.CLAIM_AMOUNT] || 0);
                actualSpent += amount;
            });
        });

        return {
            id: milestone.ID,
            name: milestone.TITLE,
            plannedBudget,
            actualSpent,
            variance: plannedBudget - actualSpent,
            variancePercent: plannedBudget > 0 ? ((actualSpent / plannedBudget) * 100).toFixed(1) : 0,
            loas: milestoneLOAs.map(loa => {
                const baseAmount = parseFloat(loa.opportunity || 0);
                const loaVOs = vosByLOA[loa.id] || [];
                const voAmount = loaVOs.reduce((sum, vo) => {
                    const amount = parseFloat(vo.opportunity || 0);
                    const isOmit = vo[VO_FIELDS.VO_TYPE] === 90; // number comparison
                    return sum + (isOmit ? -amount : amount);
                }, 0);

                return {
                    id: loa.id,
                    title: loa.title,
                    number: loa[LOA_FIELDS.LOA_NUMBER],
                    baseAmount: baseAmount,
                    voAmount: voAmount,
                    plannedBudget: baseAmount + voAmount,
                    actualSpent: (claimsByLOA[loa.id] || []).reduce((sum, c) =>
                        sum + parseFloat(c[CLAIM_FIELDS.CLAIM_AMOUNT] || 0), 0
                    ),
                    vos: loaVOs.map(vo => {
                        const amount = parseFloat(vo.opportunity || 0);
                        const isOmit = vo[VO_FIELDS.VO_TYPE] === 90; // number comparison
                        return {
                            id: vo.id,
                            title: vo.title,
                            number: vo[VO_FIELDS.VO_NUMBER],
                            description: vo[VO_FIELDS.VO_DESCRIPTION],
                            type: vo[VO_FIELDS.VO_TYPE], // 92 = Add, 90 = Omit
                            amount: amount,
                            signedAmount: isOmit ? -amount : amount // Signed for calculations
                        };
                    }),
                    claims: (claimsByLOA[loa.id] || []).map(claim => ({
                        id: claim.id,
                        title: claim.title,
                        amount: parseFloat(claim[CLAIM_FIELDS.CLAIM_AMOUNT] || 0),
                        status: claim[CLAIM_FIELDS.CLAIM_STATUS],
                        period: claim[CLAIM_FIELDS.CLAIM_PERIOD]
                    }))
                };
            })
        };
    });

    return {
        milestones: milestoneData,
        totalPlanned: milestoneData.reduce((sum, m) => sum + m.plannedBudget, 0),
        totalActual: milestoneData.reduce((sum, m) => sum + m.actualSpent, 0)
    };
}

// ============= Cashflow Functions =============

// Get all progressive billing deals with UF fields
async function getProgressiveBillingDeals() {
    return fetchAllItems('crm.deal.list', {
        'filter[CATEGORY_ID]': PROGRESSIVE_BILLING_PIPELINE_ID,
        'select': ['*', 'UF_*']
    });
}

// Get sales deals by IDs (for booking fee / down payment lookup)
async function getSalesDealsByIds(dealIds) {
    if (!dealIds || dealIds.length === 0) return [];
    const uniqueIds = [...new Set(dealIds)];
    return fetchAllItems('crm.deal.list', {
        'filter[ID]': uniqueIds,
        'filter[CATEGORY_ID]': PIPELINES.SALES_BOOKING,
        'select': ['ID', 'TITLE', 'OPPORTUNITY', SALES_DEAL_FIELDS.BOOKING_FEE, SALES_DEAL_FIELDS.DOWN_PAYMENT, 'UF_*']
    });
}

// Get product rows for a deal
async function getDealProductRows(dealId) {
    try {
        const data = await bitrixFetch('crm.deal.productrows.get', { id: dealId });
        return data.result || [];
    } catch (e) {
        return [];
    }
}

// Parse money field value (format: "amount|currency" e.g. "224300|MYR")
function parseMoneyField(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const str = String(value);
    const parts = str.split('|');
    return parseFloat(parts[0]) || 0;
}

// Count how many milestone stages a billing deal has reached
// e.g. if at "Piling Work" (index 1), it has completed stages 0 and 1 = 2 milestones
function getMilestonesReached(stageId) {
    const index = BILLING_MILESTONE_ORDER.findIndex(m => m.stageId === stageId);
    if (index === -1) return 0; // S&P Successful or unknown = 0 milestones invoiced
    return index + 1; // 1-based count
}

// Aggregate cashflow data: money out (construction claims) vs money in (progressive billing)
export async function getCashflowData() {
    const [milestones, loas, vos, claims, billingDeals] = await Promise.all([
        getConstructionMilestones(),
        getAllLOAs(),
        getAllVOs(),
        getAllClaims(),
        getProgressiveBillingDeals()
    ]);

    // --- Money Out (same logic as construction cost) ---
    const loasByMilestone = {};
    loas.forEach(loa => {
        const milestoneId = loa[LOA_FIELDS.PARENT_MILESTONE];
        if (milestoneId) {
            if (!loasByMilestone[milestoneId]) loasByMilestone[milestoneId] = [];
            loasByMilestone[milestoneId].push(loa);
        }
    });

    const vosByLOA = {};
    vos.forEach(vo => {
        const loaId = vo[VO_FIELDS.PARENT_LOA];
        if (loaId) {
            if (!vosByLOA[loaId]) vosByLOA[loaId] = [];
            vosByLOA[loaId].push(vo);
        }
    });

    const claimsByLOA = {};
    claims.forEach(claim => {
        const loaId = claim[CLAIM_FIELDS.PARENT_LOA];
        if (loaId) {
            if (!claimsByLOA[loaId]) claimsByLOA[loaId] = [];
            claimsByLOA[loaId].push(claim);
        }
    });

    // --- Money In (progressive billing with proper formula) ---

    // 1. Get all parent sales deal IDs from billing deals
    const parentSalesDealIds = billingDeals
        .map(d => d[BILLING_DEAL_FIELDS.PARENT_SALES_DEAL])
        .filter(id => id);

    // 2. Fetch parent sales deals to get booking fee & down payment
    const salesDeals = await getSalesDealsByIds(parentSalesDealIds);

    // 3. Build sales deal map
    const salesDealMap = {};
    salesDeals.forEach(sd => { salesDealMap[sd.ID] = sd; });

    // 4. Count how many billing deals each sales deal has (for splitting booking fee)
    const unitCountBySalesDeal = {};
    billingDeals.forEach(bd => {
        const parentId = bd[BILLING_DEAL_FIELDS.PARENT_SALES_DEAL];
        if (parentId) {
            unitCountBySalesDeal[parentId] = (unitCountBySalesDeal[parentId] || 0) + 1;
        }
    });

    // 5. Calculate money in for each billing deal using schedule of payment percentages
    const billingDealData = billingDeals.map(bd => {
        const fullPrice = parseFloat(bd.OPPORTUNITY || 0);
        const parentSalesDealId = bd[BILLING_DEAL_FIELDS.PARENT_SALES_DEAL];
        const parentDeal = salesDealMap[parentSalesDealId] || {};
        const unitCount = unitCountBySalesDeal[parentSalesDealId] || 1;

        // Booking fee from sales deal, split equally among units
        const totalBookingFee = parseFloat(parentDeal[SALES_DEAL_FIELDS.BOOKING_FEE] || 0);
        const bookingFeePerUnit = totalBookingFee / unitCount;

        // How many milestones has this unit reached?
        const milestonesReached = getMilestonesReached(bd.STAGE_ID);

        // Per-milestone breakdown using actual schedule percentages
        const milestoneBreakdown = BILLING_MILESTONE_ORDER.map((milestone, idx) => {
            const amount = fullPrice * (milestone.percent / 100);
            return {
                stageId: milestone.stageId,
                label: BILLING_STAGE_LABELS[milestone.stageId],
                percent: milestone.percent,
                amount,
                invoiced: idx < milestonesReached
            };
        });

        // Money in = sum of invoiced milestone amounts
        const moneyIn = milestoneBreakdown
            .filter(mb => mb.invoiced)
            .reduce((sum, mb) => sum + mb.amount, 0);

        return {
            id: bd.ID,
            title: bd.TITLE,
            fullPrice,
            bookingFee: bookingFeePerUnit,
            stageId: bd.STAGE_ID,
            stageLabel: BILLING_STAGE_LABELS[bd.STAGE_ID] || bd.STAGE_ID,
            milestonesReached,
            moneyIn,
            milestoneBreakdown,
            parentSalesDealId,
            date: bd.DATE_CREATE
        };
    });

    // 6. Aggregate money in per milestone stage across all billing deals
    const moneyInByMilestone = {};
    BILLING_MILESTONE_ORDER.forEach(m => {
        moneyInByMilestone[m.stageId] = 0;
    });
    billingDealData.forEach(bd => {
        bd.milestoneBreakdown.forEach(mb => {
            if (mb.invoiced) {
                moneyInByMilestone[mb.stageId] += mb.amount;
            }
        });
    });

    const totalMoneyIn = billingDealData.reduce((sum, bd) => sum + bd.moneyIn, 0);

    // --- Build construction milestone data (Money Out) ---
    const constructionMilestoneData = milestones.map(milestone => {
        const milestoneLOAs = loasByMilestone[milestone.ID] || [];

        let plannedBudget = 0;
        let moneyOut = 0;

        milestoneLOAs.forEach(loa => {
            const baseAmount = parseFloat(loa.opportunity || 0);
            const loaVOs = vosByLOA[loa.id] || [];
            const voAmount = loaVOs.reduce((sum, vo) => {
                const amount = parseFloat(vo.opportunity || 0);
                const isOmit = vo[VO_FIELDS.VO_TYPE] === 90;
                return sum + (isOmit ? -amount : amount);
            }, 0);

            plannedBudget += baseAmount + voAmount;

            const loaClaims = claimsByLOA[loa.id] || [];
            loaClaims.forEach(claim => {
                moneyOut += parseFloat(claim[CLAIM_FIELDS.CLAIM_AMOUNT] || 0);
            });
        });

        return {
            id: milestone.ID,
            name: milestone.TITLE,
            stageId: milestone.STAGE_ID,
            plannedBudget,
            moneyOut,
            loaCount: milestoneLOAs.length,
            claimCount: milestoneLOAs.reduce((sum, loa) => sum + (claimsByLOA[loa.id] || []).length, 0)
        };
    });

    const totalMoneyOut = constructionMilestoneData.reduce((sum, m) => sum + m.moneyOut, 0);
    const totalPlanned = constructionMilestoneData.reduce((sum, m) => sum + m.plannedBudget, 0);

    // --- Build per-milestone-stage summary (Money In per stage vs Money Out per stage) ---
    // Map construction milestones by name for matching to billing stages
    const constructionByName = {};
    constructionMilestoneData.forEach(m => {
        constructionByName[m.name.trim().toLowerCase()] = m;
    });

    const milestoneStageSummary = BILLING_MILESTONE_ORDER.map(milestone => {
        const label = BILLING_STAGE_LABELS[milestone.stageId];
        // Match construction milestone by name (e.g. "Site Clearing" matches "Site Clearing")
        const matchedConstruction = constructionByName[label.trim().toLowerCase()] || null;
        return {
            stageId: milestone.stageId,
            label,
            percent: milestone.percent,
            moneyIn: moneyInByMilestone[milestone.stageId],
            moneyOut: matchedConstruction ? matchedConstruction.moneyOut : 0,
            plannedBudget: matchedConstruction ? matchedConstruction.plannedBudget : 0,
            loaCount: matchedConstruction ? matchedConstruction.loaCount : 0,
            claimCount: matchedConstruction ? matchedConstruction.claimCount : 0
        };
    });

    return {
        // Construction milestones (Money Out)
        constructionMilestones: constructionMilestoneData,
        totalMoneyOut,
        totalPlanned,

        // Billing deals (Money In)
        billingDeals: billingDealData,
        totalMoneyIn,

        // Per-milestone-stage summary
        milestoneStageSummary,

        // Net
        netCashflow: totalMoneyIn - totalMoneyOut
    };
}
