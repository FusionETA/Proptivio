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
        <Script id="bitrix24-chat" strategy="afterInteractive">{`
          (function(w,d,u){
            var s=d.createElement('script');s.async=true;s.src=u+'?'+(Date.now()/60000|0);
            var h=d.getElementsByTagName('script')[0];h.parentNode.insertBefore(s,h);
          })(window,document,'https://cdn.bitrix24.com/b27727723/crm/site_button/loader_6_e1k601.js');
        `}</Script>
      </body>
    </html>
  );
}
