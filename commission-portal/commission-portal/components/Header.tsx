"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="px-8 py-6">
                <div className="mb-6 flex items-center gap-4">
                    <Image src="/logo.svg" alt="Proptivio" width={48} height={48} className="rounded-xl" />
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Commission Portal</h1>
                        <p className="text-gray-500 mt-1">Manage commission statements and approvals efficiently.</p>
                    </div>
                </div>

                <nav className="flex gap-2">
                    <Link
                        href="/"
                        className={cn(
                            "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                            isActive('/') && pathname === '/'
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        )}
                    >
                        Overview
                    </Link>
                    <Link
                        href="/agents"
                        className={cn(
                            "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                            isActive('/agents') || isActive('/agent/')
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        )}
                    >
                        Agents
                    </Link>
                </nav>
            </div>
        </header>
    );
}
