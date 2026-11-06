"use client";

import Link from "next/link";
import { LayoutDashboard, Users, User, FileText, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function Sidebar() {
    // In a real app, you'd use a hook to get the current path
    // simpler for now to just hardcode basic nav

    return (
        <div className="hidden border-r bg-white w-64 md:block fixed h-full z-10">
            <div className="flex h-16 items-center border-b px-6">
                <h1 className="text-xl font-bold text-indigo-600 tracking-tight">Commission<span className="text-gray-900">Portal</span></h1>
            </div>
            <div className="py-4">
                <nav className="grid gap-1 px-2">
                    <NavItem icon={<LayoutDashboard size={20} />} label="Overview" href="/" />
                    <NavItem icon={<Users size={20} />} label="Agents" href="/agents" />
                </nav>
            </div>
        </div>
    );
}

function NavItem({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-gray-900 hover:bg-gray-100"
        >
            {icon}
            <span className="font-medium text-sm">{label}</span>
        </Link>
    );
}
