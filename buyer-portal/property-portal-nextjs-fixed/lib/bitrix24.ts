/**
 * Bitrix24 API Client
 */

export interface Bitrix24Response<T = any> {
  result?: T;
  total?: number;
  next?: number;
  time?: {
    start: number;
    finish: number;
    duration: number;
  };
}

export interface Contact {
  ID: string;
  NAME: string;
  LAST_NAME: string;
  EMAIL: Array<{ VALUE: string }>;
  PHONE: Array<{ VALUE: string }>;
  UF_CRM_1764733889692: string; // NRIC / Passport No.
  UF_CRM_1765504893211: string; // Nationality Enum ID
  UF_CRM_1769154272?: string; // Portal Password
  UF_CRM_1769154361?: string; // Reset Token
  ADDRESS: string;
  ADDRESS_COUNTRY: string;
}

export const NATIONALITY_MAPPING: Record<string, string> = {
  '62': 'Malaysian',
  '64': 'Singaporean',
  '66': 'Chinese',
};

export function getNationalityLabel(id: string): string {
  return NATIONALITY_MAPPING[id] || id;
}

export interface Deal {
  ID: string;
  TITLE: string;
  STAGE_ID: string;
  CATEGORY_ID: string;
  OPPORTUNITY: string;
  CURRENCY_ID: string;
  DATE_CREATE: string;
  CLOSED: string;
  [key: string]: any; // For UF_* fields
}

export interface File {
  id: string;
  name: string;
  showUrl?: string;
  downloadUrl?: string;
}

const WEBHOOK_URL = process.env.NEXT_PUBLIC_BITRIX24_WEBHOOK!;

/**
 * Make API request to Bitrix24
 */
/**
 * Make API request to Bitrix24
 */
export async function bitrix24Request<T = any>(
  method: string,
  params: Record<string, any> = {}
): Promise<Bitrix24Response<T> | null> {
  // Ensure WEBHOOK_URL ends with a slash for correct path resoluton
  const baseUrl = WEBHOOK_URL.endsWith('/') ? WEBHOOK_URL : `${WEBHOOK_URL}/`;
  const url = `${baseUrl}${method}.json`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Bitrix24 API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Bitrix24 request failed:', error);
    return null;
  }
}

/**
 * Get contact by email
 */
export async function getContactByEmail(email: string): Promise<Contact | null> {
  const result = await bitrix24Request<Contact[]>('crm.contact.list', {
    filter: { EMAIL: email },
    select: [
      'ID',
      'NAME',
      'LAST_NAME',
      'EMAIL',
      'PHONE',
      'UF_CRM_1764733889692', // NRIC / Passport No.
      'UF_CRM_1765504893211', // Nationality
      'ADDRESS',
      'ADDRESS_COUNTRY',
      'UF_CRM_1769154272', // Portal Password
      'UF_CRM_1769154361', // Reset Token
    ],
  });

  if (result?.result && result.result.length > 0) {
    return result.result[0];
  }

  return null;
}

/**
 * Update contact fields
 */
export async function updateContact(contactId: string, fields: Record<string, any>): Promise<boolean> {
  const result = await bitrix24Request('crm.contact.update', {
    id: contactId,
    fields: fields
  });

  return !!result?.result;
}

/**
 * Get units (deals) for a contact
 */
/**
 * Get units (deals) for a contact
 */
export async function getUnitsForContact(contactId: string): Promise<Deal[]> {
  console.log('Fetching units for contact:', contactId);
  const categoryId = process.env.PROGRESSIVE_BILLING_CATEGORY || '4';

  // Efficient query: Filter directly by CONTACT_ID and CATEGORY_ID
  const result = await bitrix24Request<Deal[]>('crm.deal.list', {
    filter: {
      CATEGORY_ID: categoryId,
      CONTACT_ID: contactId
    },
    select: [
      'ID',
      'TITLE',
      'STAGE_ID',
      'OPPORTUNITY',
      'CURRENCY_ID',
      'DATE_CREATE',
      'CLOSED',
      'UF_*', // Get user fields
    ],
    order: { DATE_CREATE: 'DESC' }
  });

  if (!result?.result) {
    console.log('No deals found or API error');
    return [];
  }

  console.log(`Found ${result.result.length} deals`);
  return result.result;
}

/**
 * Get deal by ID
 */
export async function getDealById(dealId: string): Promise<Deal | null> {
  const result = await bitrix24Request<Deal>('crm.deal.get', { ID: dealId });
  return result?.result || null;
}

/**
 * Check if contact has access to a deal
 */
/**
 * Check if contact has access to a deal
 */
export async function verifyContactAccess(
  dealId: string,
  contactId: string
): Promise<boolean> {
  console.log(`Verifying access for Deal: ${dealId}, Contact: ${contactId}`);

  const result = await bitrix24Request<Array<{ CONTACT_ID: string | number }>>(
    'crm.deal.contact.items.get',
    { id: dealId }
  );

  console.log('Access check API response:', JSON.stringify(result));

  if (result?.result) {
    // Convert both to strings for safe comparison (Bitrix might return numbers)
    const hasAccess = result.result.some((c) => String(c.CONTACT_ID) === String(contactId));
    console.log(`Access granted: ${hasAccess}`);
    return hasAccess;
  }

  console.log('Access denied: No result from API');
  return false;
}
