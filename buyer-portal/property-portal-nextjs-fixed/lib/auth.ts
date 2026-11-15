import { cookies } from 'next/headers';
import { getContactByEmail } from './bitrix24';
import * as fs from 'fs';
import * as path from 'path';

const SESSION_COOKIE_NAME = 'buyer_session';
const DEFAULT_PASSWORD = process.env.BUYER_PASSWORD || 'testtest123';
const PASSWORDS_FILE = process.env.BUYER_PASSWORDS_FILE || '/root/buyer-portal-passwords.json';

export interface Session {
  email: string;
  createdAt: number;
}

function loadPasswords(): Record<string, string> {
  try {
    if (fs.existsSync(PASSWORDS_FILE)) {
      return JSON.parse(fs.readFileSync(PASSWORDS_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function savePasswords(passwords: Record<string, string>): void {
  try {
    const dir = path.dirname(PASSWORDS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(passwords, null, 2), 'utf8');
  } catch (err) {
    console.error('[AUTH] Failed to save passwords:', err);
  }
}

export async function verifyPassword(email: string, inputPassword: string): Promise<boolean> {
  const contact = await getContactByEmail(email);
  if (!contact) {
    console.log('[AUTH] Contact not found for email:', email);
    return false;
  }

  const passwords = loadPasswords();
  if (passwords[email]) {
    return inputPassword === passwords[email];
  }

  return inputPassword === DEFAULT_PASSWORD;
}

export async function updatePassword(email: string, newPassword: string): Promise<boolean> {
  const contact = await getContactByEmail(email);
  if (!contact) {
    console.log('[AUTH] updatePassword: Contact not found for email:', email);
    return false;
  }

  const passwords = loadPasswords();
  passwords[email] = newPassword;
  savePasswords(passwords);
  console.log('[AUTH] updatePassword: Saved password locally for:', email);
  return true;
}

export async function isUsingDefaultPassword(email: string): Promise<boolean> {
  const passwords = loadPasswords();
  return !passwords[email];
}

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
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const session: Session = JSON.parse(sessionCookie.value);

    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.createdAt > sevenDays) {
      await destroySession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
