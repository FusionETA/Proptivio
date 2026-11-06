'use server';

import { getSession } from '@/lib/auth';
import { getContactByEmail } from '@/lib/bitrix24';

export async function getProfileData() {
    const session = await getSession();
    if (!session) {
        return { session: null, contact: null };
    }

    const contact = await getContactByEmail(session.email);
    return { session, contact };
}
