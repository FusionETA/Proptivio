import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Property Development Portal',
  description: 'Track your construction progress and unit details',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://cdn.bitrix24.com/b35588853/crm/site_button/loader_4_lma361.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
