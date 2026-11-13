'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { loginAction } from './actions/auth';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await loginAction(email, password);

      if (result.success) {
        if (result.redirectUrl) {
          router.push(result.redirectUrl);
        } else {
          router.push('/units');
        }
        router.refresh();
      } else {
        setError(result.error || 'Login failed');
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
          <div className={styles.loginIcon}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/buyer/proptivio-logo.svg"
              alt="Proptivio Sdn Bhd"
              width={120}
              height={120}
            />
          </div>
          <h1 className={styles.loginTitle}>Buyer Portal</h1>
          <p className={styles.loginSubtitle}>
            Sign in to track your construction progress and unit details.
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.formInput}
              placeholder="name@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={styles.formInput}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Access Portal'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link href="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--gray-500)', textDecoration: 'underline' }}>
              Forgot your password?
            </Link>
          </div>
        </form>

        <div className={styles.footer}>
          © {new Date().getFullYear()} Property Development Portal
        </div>
      </div>
    </div>
  );
}
