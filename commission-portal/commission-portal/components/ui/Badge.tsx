import { cn } from "@/lib/utils";
import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                {
                    "border-transparent bg-indigo-600 text-white hover:bg-indigo-700": variant === "default",
                    "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200": variant === "secondary",
                    "border-transparent bg-red-100 text-red-700 hover:bg-red-200": variant === "destructive",
                    "border-transparent bg-green-100 text-green-700 hover:bg-green-200": variant === "success",
                    "border-transparent bg-yellow-100 text-yellow-700 hover:bg-yellow-200": variant === "warning",
                    "text-foreground": variant === "outline",
                },
                className
            )}
            {...props}
        />
    );
}
