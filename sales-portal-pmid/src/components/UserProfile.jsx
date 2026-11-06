'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UserProfile() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);

    if (!user) return null;

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const initials = user.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email[0].toUpperCase();

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-gray-900">{user.fullName || user.email}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white">
                    {initials}
                </div>
            </button>

            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <p className="text-sm font-bold text-gray-900">{user.fullName || 'User'}</p>
                            {/* <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                            {user.id && (
                                <p className="text-xs text-gray-400 mt-1">ID: {user.id}</p>
                            )} */}
                        </div>

                        <div className="p-2">
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
