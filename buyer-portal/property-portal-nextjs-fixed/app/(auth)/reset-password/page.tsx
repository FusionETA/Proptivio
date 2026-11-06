'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../../login.module.css';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Validation similar to ChangePasswordPage
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
        if (!token || !email) {
            setError('Invalid link. Please request a new one.');
            return;
        }

        setError('');

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
            const { resetPasswordAction } = await import('@/app/actions/password');
            const result = await resetPasswordAction(email, token, password);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/');
                }, 3000);
            } else {
                setError(result.error || 'Failed to reset password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className={styles.loginPage}>
                <div className={styles.loginCard}>
                    <div className={styles.errorMessage}>Invalid or missing reset link.</div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className={styles.loginPage}>
                <div className={styles.loginCard}>
                    <div className="p-4 mb-6 bg-green-100 text-green-700 rounded-xl text-center font-medium">
                        Password Reset Successfully! Redirecting to login...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginCard}>
                <div className={styles.loginHeader}>
                    <h1 className={styles.loginTitle}>Set New Password</h1>
                    <p className={styles.loginSubtitle}>
                        Create a new secure password for {email}
                    </p>
                </div>

                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                    </div>
                )}

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
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className={styles.loginPage}>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
