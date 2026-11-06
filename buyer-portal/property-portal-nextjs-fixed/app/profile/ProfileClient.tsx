'use client';

import { logoutAction } from '../actions/auth';
import styles from './profile.module.css';

interface ProfileClientProps {
    email: string;
}

export default function ProfileClient({ email }: ProfileClientProps) {
    const handleChangePassword = async () => {
        const { requestPasswordReset } = await import('@/app/actions/password');
        await requestPasswordReset(email);
        alert('Password reset link has been sent to your email!');
    };

    return (
        <div className={styles.userInfo}>
            <span className={styles.userEmail}>{email}</span>
            <form action={logoutAction}>
                <button type="submit" className={styles.btnLogout}>
                    Logout
                </button>
            </form>
            <button
                onClick={handleChangePassword}
                className={styles.btnLogout}
                style={{
                    marginLeft: '0.5rem',
                }}
            >
                Change Password
            </button>
        </div>
    );
}
