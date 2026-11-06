'use server';

import { getSession, updatePassword, destroySession } from '@/lib/auth';
import { getContactByEmail, updateContact } from '@/lib/bitrix24';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

const BITRIX_RESET_TOKEN_FIELD = process.env.BITRIX24_FIELD_RESET_TOKEN || 'UF_CRM_1769154361';

// --- Email Transporter ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function changePasswordAction(newPassword: string) {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        const success = await updatePassword(session.email, newPassword);

        if (success) {
            // Log them out so they have to login with new password
            await destroySession();
            return { success: true };
        } else {
            return { success: false, error: 'Failed to update contact in Bitrix24' };
        }
    } catch (error) {
        console.error('Change password error:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function requestPasswordReset(email: string) {
    try {
        const contact = await getContactByEmail(email);
        // Security: Always return success even if email not found to prevent enumeration
        if (!contact) {
            return { success: true };
        }

        // Generate token
        const token = randomBytes(32).toString('hex');
        const tokenPayload = JSON.stringify({
            token,
            expires: Date.now() + 3600000 // 1 hour
        });

        console.log('[RESET REQUEST] Generating token for:', email);
        console.log('[RESET REQUEST] Token:', token.substring(0, 10) + '...');

        // Save token to Bitrix
        const updated = await updateContact(contact.ID, {
            [BITRIX_RESET_TOKEN_FIELD]: tokenPayload
        });

        if (!updated) {
            return { success: false, error: 'System error. Please contact support.' };
        }

        // Send Email
        const resetUrl = 'https://buyer-portal.vercel.app/reset-password?token=' + token + '&email=' + encodeURIComponent(email);

        console.log('[RESET REQUEST] Reset URL:', resetUrl);

        const clientName = contact.NAME || 'Valued Client';

        await transporter.sendMail({
            from: `"Proptivio Portal" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset Your Password - Proptivio Portal',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          <p>Hello ${clientName},</p>
          
          <p>We received a request to reset the password for your account. No worries — it happens to the best of us 😊</p>
          
          <p>To create a new password, simply click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #000000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset My Password</a>
          </div>
          
          <p style="font-size: 12px; color: #666; margin-top: 30px;">For your security, this link will expire in 1 hour. If you didn’t request this reset, you can safely ignore this email — your account will remain protected.</p>
        </div>
      `,
        });

        return { success: true };

    } catch (error) {
        console.error('Request reset error:', error);
        return { success: false, error: 'Failed to process request' };
    }
}

export async function resetPasswordAction(email: string, token: string, newPassword: string) {
    try {
        console.log('[RESET] Starting password reset for:', email);
        console.log('[RESET] Token received:', token.substring(0, 10) + '...');

        const contact = await getContactByEmail(email);
        if (!contact) {
            console.log('[RESET] Contact not found');
            return { success: false, error: 'Invalid request' };
        }

        // Verify token
        const savedTokenRaw = (contact as any)[BITRIX_RESET_TOKEN_FIELD];
        console.log('[RESET] Saved token exists:', !!savedTokenRaw);

        if (!savedTokenRaw) {
            console.log('[RESET] No token found in Bitrix');
            return { success: false, error: 'Invalid or expired token' };
        }

        let savedToken: { token: string, expires: number };
        try {
            savedToken = JSON.parse(savedTokenRaw);
            console.log('[RESET] Parsed token successfully');
            console.log('[RESET] Saved token preview:', savedToken.token.substring(0, 10) + '...');
            console.log('[RESET] Tokens match:', savedToken.token === token);
            console.log('[RESET] Token expires:', new Date(savedToken.expires).toISOString());
            console.log('[RESET] Current time:', new Date().toISOString());
            console.log('[RESET] Is expired:', Date.now() > savedToken.expires);
        } catch (e) {
            console.log('[RESET] Failed to parse token JSON');
            return { success: false, error: 'Token data corrupted' };
        }

        if (savedToken.token !== token) {
            console.log('[RESET] Token mismatch');
            return { success: false, error: 'Invalid token' };
        }

        if (Date.now() > savedToken.expires) {
            console.log('[RESET] Token expired');
            return { success: false, error: 'Token expired' };
        }

        // Update Password
        console.log('[RESET] Token valid, updating password');
        const success = await updatePassword(email, newPassword);

        if (success) {
            // Clear token
            await updateContact(contact.ID, {
                [BITRIX_RESET_TOKEN_FIELD]: ''
            });
            console.log('[RESET] Password updated successfully');
            return { success: true };
        } else {
            console.log('[RESET] Failed to update password');
            return { success: false, error: 'Failed to update password' };
        }

    } catch (error) {
        console.error('[RESET] Reset password error:', error);
        return { success: false, error: 'Internal server error' };
    }
}
