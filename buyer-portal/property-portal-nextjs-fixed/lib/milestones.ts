/**
 * Milestone Management Functions
 */

import { bitrix24Request, Deal, File } from './bitrix24';

export interface Milestone {
  order: number;
  deal_id: string;
  name: string;
  stage_id: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Cancelled';
  start_date: string | null;
  end_date: string | null;
  progress: number;
  pictures: ProcessedFile[];
  milestone_stage_id: string;
  internal_stage: string;
  internal_stages_status: {
    new: 'Completed' | 'Pending';
    verification: 'Completed' | 'Pending';
    billing: 'Completed' | 'Pending';
    close_deal: 'Completed' | 'Pending';
  };
}

export interface ProcessedFile {
  id: string;
  name: string;
  url: string;
}

export const CONSTRUCTION_MILESTONES: Record<number, string> = {
  1: 'Site Clearing',
  2: 'Piling Work',
  3: 'Foundation Work',
  4: 'Concrete Reinforcement',
  5: 'Electrical Wiring & Plumbing',
  6: 'Roofing',
  7: 'Internal & External Plastering',
  8: 'Roads & Drains',
};

export const INTERNAL_STAGES: Record<string, string> = {
  new: 'New',
  verification: 'Verification',
  billing: 'Billing',
  close_deal: 'Close Deal',
};

/**
 * Get milestone deal IDs (shared across all units)
 */
export function getMilestoneDealIds(): Record<number, string> {
  return {
    1: '20', // Site Clearing
    2: '24', // Piling Work
    3: '26', // Foundation Work
    4: '28', // Concrete Reinforcement
    5: '30', // Electrical Wiring & Plumbing
    6: '32', // Roofing
    7: '34', // Internal & External Plastering
    8: '36', // Roads & Drains
  };
}

/**
 * Get stage to milestone mapping for Category 4 (Progressive Billing)
 */
export function getStageToMilestoneMapping(): Record<string, number> {
  return {
    'C150:PREPARATION': 1,       // Site Clearing
    'C150:PREPAYMENT_INVOI': 2,  // Piling Work
    'C150:EXECUTING': 3,         // Foundation Work
    'C150:FINAL_INVOICE': 4,     // Concrete Reinforcement
    'C150:UC_ELEC_PLUMB': 5,     // Electrical Wiring & Plumbing
    'C150:UC_ROOFING': 6,        // Roofing
    'C150:UC_PLASTERING': 7,     // Internal & External Plastering
    'C150:UC_ROADS': 8,          // Roads & Drains
    'C150:WON': 9,               // Close Deal (all complete)
  };
}

/**
 * Determine milestone status from stage ID
 */
export function getMilestoneStatus(
  stageId: string
): 'Not Started' | 'In Progress' | 'Completed' | 'Cancelled' {
  // C6 stages (milestone deals)
  if (stageId.startsWith('C6:')) {
    switch (stageId) {
      case 'C6:WON':
        return 'Completed';
      case 'C6:PREPARATION':
      case 'C6:PREPAYMENT_INVOICE':
        return 'In Progress';
      case 'C6:LOSE':
        return 'Cancelled';
      case 'C6:NEW':
      default:
        return 'Not Started';
    }
  }

  // C150 stages (progressive billing / unit deals)
  switch (stageId) {
    case 'C150:WON':
      return 'Completed';
    case 'C150:PREPARATION':
    case 'C150:PREPAYMENT_INVOI':
    case 'C150:EXECUTING':
    case 'C150:FINAL_INVOICE':
    case 'C150:UC_ELEC_PLUMB':
    case 'C150:UC_ROOFING':
    case 'C150:UC_PLASTERING':
    case 'C150:UC_ROADS':
      return 'In Progress';
    case 'C150:NEW':
    default:
      return 'Not Started';
  }
}

/**
 * Get internal stage name from stage ID
 */
export function getMilestoneInternalStage(stageId: string): string {
  if (stageId.startsWith('C6:')) {
    switch (stageId) {
      case 'C6:NEW':
        return 'New';
      case 'C6:PREPARATION':
        return 'Verification';
      case 'C6:PREPAYMENT_INVOICE':
        return 'Billing';
      case 'C6:WON':
        return 'Success';
      case 'C6:LOSE':
        return 'Lost';
      default:
        return 'New';
    }
  }

  return 'New';
}

/**
 * Get internal stages completion status
 */
export function getInternalStagesStatus(stageId: string): {
  new: 'Completed' | 'Pending';
  verification: 'Completed' | 'Pending';
  billing: 'Completed' | 'Pending';
  close_deal: 'Completed' | 'Pending';
} {
  const stages = {
    new: 'Pending' as 'Completed' | 'Pending',
    verification: 'Pending' as 'Completed' | 'Pending',
    billing: 'Pending' as 'Completed' | 'Pending',
    close_deal: 'Pending' as 'Completed' | 'Pending',
  };

  if (stageId.startsWith('C6:')) {
    switch (stageId) {
      case 'C6:WON':
        stages.new = 'Completed';
        stages.verification = 'Completed';
        stages.billing = 'Completed';
        stages.close_deal = 'Completed';
        break;
      case 'C6:PREPAYMENT_INVOICE':
        stages.new = 'Completed';
        stages.verification = 'Completed';
        stages.billing = 'Completed';
        break;
      case 'C6:PREPARATION':
        stages.new = 'Completed';
        stages.verification = 'Completed';
        break;
      case 'C6:NEW':
      default:
        stages.new = 'Completed';
        break;
    }
  }

  return stages;
}

/**
 * Process Bitrix24 file array to extract usable URLs
 */
export function processBitrix24Files(filesArray: any[]): ProcessedFile[] {
  if (!Array.isArray(filesArray)) {
    return [];
  }

  const processedFiles: ProcessedFile[] = [];

  for (const file of filesArray) {
    if (file && typeof file === 'object' && file.id) {
      const url = getBitrix24FileUrl(file);

      if (url) {
        processedFiles.push({
          id: file.id,
          name: file.name || 'File',
          url,
        });
      }
    }
  }

  return processedFiles;
}

/**
 * Get proper download URL for a Bitrix24 CRM file attachment
 */
function getBitrix24FileUrl(fileData: any): string | null {
  if (!fileData || !fileData.id) {
    return null;
  }

  const downloadUrl = fileData.downloadUrl || fileData.showUrl || '';

  if (!downloadUrl) {
    return null;
  }

  // Parse URL parameters
  const url = new URL(downloadUrl, 'https://fusion.bitrix24.com');
  const ownerId = url.searchParams.get('ownerId');
  const fieldName = url.searchParams.get('fieldName');

  if (!ownerId || !fieldName) {
    return null;
  }

  // Build proxy URL
  const proxyUrl = `/api/image-proxy?fileId=${encodeURIComponent(
    fileData.id
  )}&ownerId=${encodeURIComponent(ownerId)}&fieldName=${encodeURIComponent(
    fieldName
  )}`;

  return proxyUrl;
}

/**
 * Get all milestone data for a specific unit deal
 */
export async function getAllMilestonesForUnit(
  dealId: string
): Promise<Milestone[]> {
  // Get the unit deal to determine progress
  const dealData = await bitrix24Request<Deal>('crm.deal.get', { ID: dealId });

  if (!dealData?.result) {
    return [];
  }

  const deal = dealData.result;
  const currentStageId = deal.STAGE_ID || 'C150:NEW';

  // Get stage mapping
  const stageMapping = getStageToMilestoneMapping();
  const currentMilestoneOrder = stageMapping[currentStageId] || 1;

  // Get shared milestone deal IDs
  const milestoneDealIds = getMilestoneDealIds();

  const milestones: Milestone[] = [];

  // Create milestone data for each of the 8 construction milestones
  for (const [orderStr, name] of Object.entries(CONSTRUCTION_MILESTONES)) {
    const order = parseInt(orderStr);

    // Determine completion status
    let status: Milestone['status'] = 'Not Started';

    if (currentMilestoneOrder === 9) {
      status = 'Completed';
    } else if (order < currentMilestoneOrder) {
      status = 'Completed';
    } else if (order === currentMilestoneOrder) {
      status = 'In Progress';
    }

    // Get shared milestone details
    const milestoneDealId = milestoneDealIds[order];
    const milestoneDealData = await bitrix24Request<Deal>('crm.deal.get', {
      ID: milestoneDealId,
    });

    let milestoneDetails: Partial<Milestone> = {
      start_date: null,
      end_date: null,
      progress: 0,
      pictures: [],
      milestone_stage_id: 'C6:NEW',
      internal_stage: 'New',
      internal_stages_status: {
        new: 'Pending',
        verification: 'Pending',
        billing: 'Pending',
        close_deal: 'Pending',
      },
    };

    if (milestoneDealData?.result) {
      const milestoneDeal = milestoneDealData.result;
      const milestoneStageId = milestoneDeal.STAGE_ID || 'C6:NEW';

      // Process files
      const pictures = processBitrix24Files(
        milestoneDeal.UF_CRM_1767342503710 || []
      );

      milestoneDetails = {
        start_date: milestoneDeal.UF_CRM_1767342457822 || null,
        end_date: milestoneDeal.UF_CRM_1767342469442 || null,
        progress: parseInt(milestoneDeal.UF_CRM_1767342483314) || 0,
        pictures,
        milestone_stage_id: milestoneStageId,
        internal_stage: getMilestoneInternalStage(milestoneStageId),
        internal_stages_status: getInternalStagesStatus(milestoneStageId),
      };
    }

    const milestone: Milestone = {
      order,
      deal_id: milestoneDealId,
      name,
      stage_id: currentStageId,
      status,
      start_date: milestoneDetails.start_date!,
      end_date: milestoneDetails.end_date!,
      progress: milestoneDetails.progress!,
      pictures: milestoneDetails.pictures!,
      milestone_stage_id: milestoneDetails.milestone_stage_id!,
      internal_stage: milestoneDetails.internal_stage!,
      internal_stages_status: milestoneDetails.internal_stages_status!,
    };

    milestones.push(milestone);
  }

  return milestones;
}

/**
 * Calculate overall completion percentage for a unit
 */
export function calculateUnitCompletionPercentage(
  milestones: Milestone[]
): number {
  if (milestones.length === 0) {
    return 0;
  }

  const completedCount = milestones.filter(
    (m) => m.status === 'Completed'
  ).length;

  return Math.round((completedCount / milestones.length) * 100);
}
