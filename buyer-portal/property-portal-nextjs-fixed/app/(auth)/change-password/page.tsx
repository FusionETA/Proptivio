'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../login.module.css';

interface ChangePasswordProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default function ChangePasswordPage({ searchParams }: ChangePasswordProps) {
    // Derive forced from searchParams. Default to true unless explicitly false.
    const forced = searchParams?.forced !== 'false';
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validatePassword = (pwd: string) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

        if (pwd.length < minLength) return 'Password must be at least 8 characters long';
        if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
        if (!hasNumber) return 'Password must contain at least one number';
        if (!hasSymbol) return 'Password must contain at least one symbol';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const validationError = validatePassword(password);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);

        try {
            // Import dynamically to avoid server-only module issues if this code is shared
            // But this is a client component calling a Server Action
            const { changePasswordAction } = await import('@/app/actions/password');
            const result = await changePasswordAction(password);

            if (result.success) {
                setSuccess('Password changed successfully! You can now log in with your new password.');
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            } else {
                setError(result.error || 'Failed to change password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginCard}>
                <div className={styles.loginHeader}>
                    <h1 className={styles.loginTitle}>Change Password</h1>
                    <p className={styles.loginSubtitle}>
                        {forced
                            ? 'For your security, you must change your password before proceeding.'
                            : 'Enter a new secure password for your account.'}
                    </p>
                </div>

                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-4 mb-6 bg-green-100 text-green-700 rounded-xl text-center font-medium">
                        {success}
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.formLabel}>
                                New Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                className={styles.formInput}
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                            <div style={{
                                marginTop: '0.75rem',
                                padding: '0.75rem',
                                background: 'var(--gold-light)',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: '0.813rem',
                                color: 'var(--gray-700)'
                            }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--gold-primary)' }}>
                                    Password Requirements:
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                                    <li>At least 8 characters long</li>
                                    <li>At least one uppercase letter (A-Z)</li>
                                    <li>At least one number (0-9)</li>
                                    <li>At least one symbol (!@#$%^&*...)</li>
                                </ul>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="confirmPassword" className={styles.formLabel}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className={styles.formInput}
                                placeholder="••••••••"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Updating...' : 'Set New Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
