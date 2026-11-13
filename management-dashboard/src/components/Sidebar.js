"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, BarChart3, Settings, Users, ArrowLeftRight, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Team', path: '/team', icon: Users },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t, language, toggleLanguage } = useLanguage();

  const navItems = [
    { name: t.navDashboard, path: '/', icon: LayoutDashboard },
    { name: t.navConstructionCost, path: '/construction-cost', icon: FolderKanban },
    { name: t.navCashflow, path: '/cashflow', icon: ArrowLeftRight },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2><span>Proptivio</span> Dashboard</h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-link ${pathname === item.path ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-100)' }}>
          <button
            onClick={toggleLanguage}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--gold-100)',
              border: '1px solid var(--gold-500)',
              borderRadius: '8px',
              color: 'var(--gray-900)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Globe size={15} />
            {language === 'en' ? '中文' : 'English'}
          </button>
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px'
          }}>
            PM
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--gray-900)', fontWeight: 500, fontSize: '14px' }}>Proptivio Admin</p>
            <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '12px' }}>{t.adminRole}</p>
          </div>
        </div>
        </div>
      </div>
    </aside>
  );
}
