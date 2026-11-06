/**
 * Login Server Action
 */

'use server';

import { redirect } from 'next/navigation';
import { verifyPassword, createSession } from '@/lib/auth';
import { getContactByEmail } from '@/lib/bitrix24';

export interface LoginResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

export async function loginAction(
  email: string,
  password: string
): Promise<LoginResult> {
  // Validate inputs
  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    };
  }

  // Verify password
  if (!await verifyPassword(email, password)) {
    return {
      success: false,
      error: 'Invalid email or password',
    };
  }

  // Verify email exists in Bitrix24
  const contact = await getContactByEmail(email);

  if (!contact) {
    return {
      success: false,
      error: 'Email not found in our system',
    };
  }

  // Create session
  await createSession(email);

  // Check if using default password
  const { isUsingDefaultPassword } = await import('@/lib/auth');
  if (await isUsingDefaultPassword(email)) {
    return {
      success: true,
      redirectUrl: '/change-password'
    };
  }

  // Standard redirect
  return {
    success: true,
    redirectUrl: '/units'
  };
}

export async function logoutAction(): Promise<void> {
  const { destroySession } = await import('@/lib/auth');
  await destroySession();
  redirect('/');
}
