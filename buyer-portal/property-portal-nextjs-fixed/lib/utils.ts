/**
 * Utility Functions
 */

import { Deal } from './bitrix24';

export interface UnitDetails {
  id: string;
  title: string;
  tower: string;
  floor: string;
  unit: string;
  contract_value: string;
  currency: string;
  status: string;
}

function parseUnitLocation(title: string): Pick<UnitDetails, 'tower' | 'floor' | 'unit'> {
  const trimmedTitle = title.trim();
  const trailingHyphenCode = trimmedTitle.match(/(\d{1,2})-(\d{2})\s*$/);

  if (trailingHyphenCode) {
    return {
      tower: trimmedTitle.slice(0, trailingHyphenCode.index).trim(),
      floor: `Floor ${trailingHyphenCode[1]}`,
      unit: trailingHyphenCode[2],
    };
  }

  const compactUnitCode = trimmedTitle.match(/(\d{2})(\d{2})\s*$/);

  if (compactUnitCode) {
    return {
      tower: trimmedTitle.slice(0, compactUnitCode.index).trim(),
      floor: `Floor ${compactUnitCode[1]}`,
      unit: compactUnitCode[2],
    };
  }

  const parts = trimmedTitle.split('-');

  return {
    tower: parts[0] || '',
    floor: parts[1] ? `Floor ${parts[1]}` : '',
    unit: parts[2] || '',
  };
}

/**
 * Get unit property details
 */
export function getUnitDetails(deal: Deal): UnitDetails {
  const location = parseUnitLocation(deal.TITLE);

  return {
    id: deal.ID,
    title: deal.TITLE,
    tower: location.tower,
    floor: location.floor,
    unit: location.unit,
    contract_value: formatNumber(parseFloat(deal.OPPORTUNITY)),
    currency: deal.CURRENCY_ID,
    status: deal.STAGE_ID,
  };
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date to human-readable format
 */
export function formatDate(date: string | null): string {
  if (!date) return 'N/A';

  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Get milestone status color
 */
export function getMilestoneStatusColor(
  status: string
): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    'Not Started': { bg: '#f3f4f6', text: '#6b7280' },
    'In Progress': { bg: '#dbeafe', text: '#1e40af' },
    Completed: { bg: '#d1fae5', text: '#065f46' },
    Cancelled: { bg: '#fee2e2', text: '#dc2626' },
  };

  return colors[status] || colors['Not Started'];
}

/**
 * Get stage status class name
 */
export function getStageStatusClass(status: string): string {
  return status.toLowerCase();
}
