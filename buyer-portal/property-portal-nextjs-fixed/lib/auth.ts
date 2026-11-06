import { cookies } from 'next/headers';
import { getContactByEmail, updateContact } from './bitrix24';

const SESSION_COOKIE_NAME = 'buyer_session';
const DEFAULT_PASSWORD = process.env.BUYER_PASSWORD || 'testtest123';
const BITRIX_PASSWORD_FIELD = process.env.BITRIX24_FIELD_PASSWORD || 'UF_CRM_1769154272';

export interface Session {
  email: string;
  createdAt: number;
}

/**
 * Verify password
 * Checks Bitrix custom field first, then falls back to default.
 * WARNING: Passwords are stored in PLAIN TEXT for admin visibility
 */
export async function verifyPassword(email: string, inputPassword: string): Promise<boolean> {
  // 1. Get contact data to check for custom password
  const contact = await getContactByEmail(email);
  if (!contact) {
    console.log('[AUTH] Contact not found for email:', email);
    return false;
  }

  // 2. Check if user has a custom password set (stored in plain text)
  const savedPassword = (contact as any)[BITRIX_PASSWORD_FIELD];
  console.log('[AUTH] Checking password for:', email);
  console.log('[AUTH] Field name:', BITRIX_PASSWORD_FIELD);
  console.log('[AUTH] Saved password exists:', !!savedPassword);
  console.log('[AUTH] Saved password value:', savedPassword ? savedPassword.substring(0, 3) + '***' : 'null');

  if (savedPassword) {
    // Direct plain text comparison
    const isValid = inputPassword === savedPassword;
    console.log('[AUTH] Password comparison result:', isValid);
    return isValid;
  }

  // 3. Fallback to default password if no custom password set
  console.log('[AUTH] No password found, checking default password');
  const isDefault = inputPassword === DEFAULT_PASSWORD;
  console.log('[AUTH] Default password match:', isDefault);
  return isDefault;
}

/**
 * Update user password
 * WARNING: Stores password in PLAIN TEXT for admin visibility
 */
export async function updatePassword(email: string, newPassword: string): Promise<boolean> {
  const contact = await getContactByEmail(email);
  if (!contact) {
    console.log('[AUTH] updatePassword: Contact not found for email:', email);
    return false;
  }

  console.log('[AUTH] updatePassword: Storing plain text password for contact ID:', contact.ID);
  console.log('[AUTH] updatePassword: Field name:', BITRIX_PASSWORD_FIELD);
  console.log('[AUTH] updatePassword: Password preview:', newPassword.substring(0, 3) + '***');

  const success = await updateContact(contact.ID, {
    [BITRIX_PASSWORD_FIELD]: newPassword
  });

  console.log('[AUTH] updatePassword: Update result:', success);
  return success;
}

/**
 * Check if user is using default password
 */
export async function isUsingDefaultPassword(email: string): Promise<boolean> {
  const contact = await getContactByEmail(email);
  if (!contact) return false;

  const savedHash = (contact as any)[BITRIX_PASSWORD_FIELD];
  return !savedHash;
}

/**
 * Create session
 */
export async function createSession(email: string): Promise<void> {
  const session: Session = {
    email,
    createdAt: Date.now(),
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const session: Session = JSON.parse(sessionCookie.value);

    // Validate session age (7 days)
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.createdAt > sevenDays) {
      await destroySession();
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Destroy session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Require authentication (for server components)
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
