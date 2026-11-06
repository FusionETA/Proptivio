'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../../login.module.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { requestPasswordReset } = await import('@/app/actions/password');
            const result = await requestPasswordReset(email);

            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.error || 'Failed to send reset email');
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
                    <h1 className={styles.loginTitle}>Forgot Password</h1>
                    <p className={styles.loginSubtitle}>
                        Enter your email address to receive a password reset link.
                    </p>
                </div>

                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center">
                        <div className="p-4 mb-6 bg-green-100 text-green-700 rounded-xl font-medium">
                            Check your email! A reset link has been sent to {email}.
                        </div>
                        <Link href="/" className={styles.btnPrimary}>
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.formLabel}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                className={styles.formInput}
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div className={styles.footer}>
                            <Link href="/" className="hover:text-gray-900 underline">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
