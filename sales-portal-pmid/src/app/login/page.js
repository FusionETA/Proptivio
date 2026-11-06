'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast, Toaster } from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                login(result.user);
                toast.success('Welcome back!');
                router.push('/');
            } else {
                toast.error(result.error || 'Login failed');
            }
        } catch (error) {
            toast.error('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <Toaster position="top-right" toastOptions={{
                className: 'rounded-xl shadow-lg border border-gray-100',
                style: { background: '#1f2937', color: '#fff' }
            }} />

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-block p-1 mb-4">
                        <img
                            src="/logo.svg"
                            alt="Proptivio Logo"
                            className="h-16 w-auto object-contain mx-auto"
                        />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
                        Sales Portal
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Sign in to access booking
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@company.com"
                                required
                                disabled={loading}
                                className="block w-full rounded-xl border-transparent bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                disabled={loading}
                                className="block w-full rounded-xl border-transparent bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                            For internal use only. Contact IT support if you need assistance.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-8">
                    © 2026 Sales Portal. All rights reserved.
                </p>
            </div>
        </div>
    );
}
