import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { LanguageProvider } from "@/lib/LanguageContext";

export const metadata = {
  title: "Proptivio Management Dashboard",
  description: "Property Development Management Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <div className="layout">
            <Sidebar />
            <div className="main-wrapper">
              {children}
            </div>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
