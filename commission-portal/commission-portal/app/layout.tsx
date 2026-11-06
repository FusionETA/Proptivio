import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sales Commission Portal",
  description: "Commission management and statement generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen text-gray-900 antialiased bg-[url('/gold_theme_2.jpeg')] bg-cover bg-center bg-fixed")}>
        {children}
      </body>
    </html>
  );
}
