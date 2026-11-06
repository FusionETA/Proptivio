import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getContactByEmail } from '@/lib/bitrix24';
import ProfileClient from './ProfileClient';
import styles from './profile.module.css';

const NATIONALITY_MAPPING: Record<string, string> = {
    '62': 'Malaysian',
    '64': 'Singaporean',
    '66': 'Chinese',
};

function getNationalityLabel(id: string): string {
    return NATIONALITY_MAPPING[id] || id;
}

export default async function ProfilePage() {
    console.log('[PROFILE] Loading profile data on server...');
    const session = await getSession();

    if (!session) {
        console.log('[PROFILE] No session, redirecting to login');
        redirect('/');
    }

    const contact = await getContactByEmail(session.email);

    if (!contact) {
        console.log('[PROFILE] Contact not found, redirecting to login');
        redirect('/');
    }

    const phoneNumber = contact.PHONE && contact.PHONE.length > 0 ? contact.PHONE[0].VALUE : '-';
    console.log('[PROFILE] Profile data loaded successfully on server');

    return (
        <div className={styles.profilePage}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.titleSection}>
                        <Link href="/units" className={styles.backLink}>
                            ← Back to Dashboard
                        </Link>
                        <h1>My Profile</h1>
                    </div>
                    <ProfileClient email={session.email} />
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <div className={styles.profileCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.avatar}>
                            {contact.NAME ? contact.NAME.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className={styles.headerText}>
                            <h2>{contact.NAME} {contact.LAST_NAME}</h2>
                            <p>Client Profile</p>
                        </div>
                    </div>

                    <div className={styles.cardBody}>
                        <div className={styles.sectionTitle}>Personal Information</div>

                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label>Full Name</label>
                                <div className={styles.value}>{contact.NAME} {contact.LAST_NAME}</div>
                            </div>

                            <div className={styles.field}>
                                <label>Phone Number</label>
                                <div className={styles.value}>{phoneNumber}</div>
                            </div>

                            <div className={styles.field}>
                                <label>Email Address</label>
                                <div className={styles.value}>{session.email}</div>
                            </div>

                            <div className={styles.field}>
                                <label>NRIC / Passport No.</label>
                                <div className={styles.value}>
                                    {contact.UF_CRM_1764733889692 || '-'}
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label>Nationality</label>
                                <div className={styles.value}>
                                    {getNationalityLabel(contact.UF_CRM_1765504893211) || '-'}
                                </div>
                            </div>
                        </div>

                        <div className={styles.divider}></div>
                        <div className={styles.sectionTitle}>Address Information</div>

                        <div className={styles.grid}>
                            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                <label>Street Address</label>
                                <div className={styles.value}>
                                    {contact.ADDRESS || '-'}
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label>Country</label>
                                <div className={styles.value}>
                                    {contact.ADDRESS_COUNTRY || '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
