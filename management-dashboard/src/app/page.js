
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getDashboardData, isSold } from '@/lib/bitrix';
import { BOOKING_EXCLUDED_STAGES, SALES_STAGES } from '@/lib/constants';
import { Building2, TrendingUp, DollarSign, Home, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function Dashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soldToggle, setSoldToggle] = useState('BOOKING_PAID');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [nationalityFilter, setNationalityFilter] = useState('ALL');

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const d = await getDashboardData();
        setData(d);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  // Extract unique nationalities for the filter dropdown
  const nationalities = useMemo(() => {
    if (!data) return [];

    // Get list of all nationalities from the full map (if available) or sold units backup
    let nats = [];
    if (data.nationalityMap) {
      nats = Object.values(data.nationalityMap);
    } else {
      nats = data.soldUnits
        .map(u => u.nationality)
        .filter(n => n && n !== 'Unknown' && n !== null);
    }

    return [...new Set(nats)].sort();
  }, [data]);

  const kpis = useMemo(() => {
    if (!data) return null;

    let filteredUnits = data.soldUnits;
    if (projectFilter !== 'ALL') {
      filteredUnits = filteredUnits.filter(u => u.section === projectFilter);
    }

    // Apply nationality filter
    if (nationalityFilter !== 'ALL') {
      filteredUnits = filteredUnits.filter(u => u.nationality === nationalityFilter);
    }

    const bookedUnits = filteredUnits.filter(u => isBooked(u.stageId));
    const soldUnits = filteredUnits.filter(u => isSold(u.stageId, soldToggle));
    const bookedQty = bookedUnits.length;
    const bookedValue = bookedUnits.reduce((sum, u) => sum + u.price, 0);
    const soldQty = soldUnits.length;
    const soldValue = soldUnits.reduce((sum, u) => sum + u.price, 0);

    let totalQty, totalValue;
    if (projectFilter === 'ALL') {
      totalQty = data.products.totals.genSoho.qty + data.products.totals.retail.qty;
      totalValue = data.products.totals.genSoho.value + data.products.totals.retail.value;
    } else if (projectFilter === 'GEN_SOHO') {
      totalQty = data.products.totals.genSoho.qty;
      totalValue = data.products.totals.genSoho.value;
    } else {
      totalQty = data.products.totals.retail.qty;
      totalValue = data.products.totals.retail.value;
    }

    return {
      bookedQty, bookedValue, soldQty, soldValue, totalQty, totalValue,
      bookedPercent: totalQty > 0 ? ((bookedQty / totalQty) * 100).toFixed(1) : 0,
      bookedValuePercent: totalValue > 0 ? ((bookedValue / totalValue) * 100).toFixed(1) : 0,
      soldPercent: totalQty > 0 ? ((soldQty / totalQty) * 100).toFixed(1) : 0,
      soldValuePercent: totalValue > 0 ? ((soldValue / totalValue) * 100).toFixed(1) : 0
    };
  }, [data, soldToggle, projectFilter, nationalityFilter]);



  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ color: '#f43f5e', fontSize: '18px', fontWeight: 600 }}>{t.error}: {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <p style={styles.label}>{t.propertyDevelopment}</p>
          <h1 style={styles.title}>{t.dashboardTitle}</h1>
        </div>
        <div style={styles.controls}>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={styles.select}
          >
            <option value="ALL">{t.allProjects}</option>
            <option value="GEN_SOHO">{t.genSoho}</option>
            <option value="RETAIL">{t.retail}</option>
          </select>
          <select
            value={nationalityFilter}
            onChange={(e) => setNationalityFilter(e.target.value)}
            style={styles.select}
          >
            <option value="ALL">{t.allNationalities}</option>
            {nationalities.map(n => (
              <option key={n} value={n}>{t[n] || n}</option>
            ))}
          </select>
          <div style={styles.toggleGroup}>
            {['BOOKING_PAID', 'BANK_LOAN_APPROVED', 'SPA_COMPLETED'].map(mode => (
              <button
                key={mode}
                style={soldToggle === mode ? styles.toggleActive : styles.toggleBtn}
                onClick={() => setSoldToggle(mode)}
              >
                {mode === 'BOOKING_PAID' ? t.salesCompleted :
                  mode === 'BANK_LOAN_APPROVED' ? t.loanApproval : t.spaCompleted}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <KPICard
          label={t.unitsBooked}
          value={kpis?.bookedQty || 0}
          subtext={`${t.booked} ${kpis?.bookedPercent}% ${t.of} ${kpis?.totalQty || 0}`}
          badge={`${kpis?.bookedPercent}%`}
          icon={<Building2 size={22} color="#D4AF37" />}
        />
        <KPICard
          label={t.unitsSold}
          value={kpis?.soldQty || 0}
          subtext={`${t.sold} ${kpis?.soldPercent}% ${t.of} ${kpis?.totalQty || 0}`}
          badge={`${kpis?.soldPercent}%`}
          icon={<Building2 size={22} color="#D4AF37" />}
        />
        <KPICard
          label={t.bookingValue}
          value={`${((kpis?.bookedValue || 0) / 1000000).toFixed(2)}M`}
          subtext={`${((kpis?.totalValue || 0) / 1000000).toFixed(2)}M`}
          badge={`${kpis?.bookedValuePercent}%`}
          icon={<DollarSign size={22} color="#D4AF37" />}
        />
        <KPICard
          label={t.revenue}
          value={`${((kpis?.soldValue || 0) / 1000000).toFixed(2)}M`}
          subtext={`${((kpis?.totalValue || 0) / 1000000).toFixed(2)}M`}
          badge={`${kpis?.soldValuePercent}%`}
          icon={<DollarSign size={22} color="#D4AF37" />}
        />
        <KPICard
          label={t.inventory}
          value={kpis?.totalQty || 0}
          subtext={t.totalUnits}
          badge={projectFilter === 'ALL' ? 'All' : projectFilter === 'GEN_SOHO' ? 'Gen Soho' : 'Retail'}
          icon={<Home size={22} color="#D4AF37" />}
        />
        <KPICard
          label={t.totalValue}
          value={`${((kpis?.totalValue || 0) / 1000000).toFixed(2)}M`}
          subtext="MYR"
          badge="Inventory"
          icon={<TrendingUp size={22} color="#D4AF37" />}
        />
      </div>

      {/* Project Cards */}
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>{t.projectBreakdown}</h2>
      </div>
      <div style={styles.projectGrid}>
        <ProjectCard
          name={t.genSoho}
          total={data.products.totals.genSoho}
          booked={data.soldUnits.filter(u => u.section === 'GEN_SOHO' && isBooked(u.stageId) && (nationalityFilter === 'ALL' || u.nationality === nationalityFilter))}
          sold={data.soldUnits.filter(u => u.section === 'GEN_SOHO' && isSold(u.stageId, soldToggle) && (nationalityFilter === 'ALL' || u.nationality === nationalityFilter))}
          t={t}
        />
        <ProjectCard
          name={t.retail}
          total={data.products.totals.retail}
          booked={data.soldUnits.filter(u => u.section === 'RETAIL' && isBooked(u.stageId) && (nationalityFilter === 'ALL' || u.nationality === nationalityFilter))}
          sold={data.soldUnits.filter(u => u.section === 'RETAIL' && isSold(u.stageId, soldToggle) && (nationalityFilter === 'ALL' || u.nationality === nationalityFilter))}
          t={t}
        />
      </div>

      {/* Recent Sales Table */}
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>{t.recentSales}</h2>
      </div>
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{t.unit}</th>
              <th style={styles.th}>{t.project}</th>
              <th style={styles.th}>{t.price} (MYR)</th>
              <th style={styles.th}>{t.status}</th>
            </tr>
          </thead>
          <tbody>
            {data.soldUnits
              .filter(u => nationalityFilter === 'ALL' || u.nationality === nationalityFilter)
              .slice(0, 8).map((unit, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}><span style={{ fontWeight: 600 }}>{unit.productName}</span></td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: unit.section === 'GEN_SOHO' ? '#dbeafe' : '#fef3c7',
                      color: unit.section === 'GEN_SOHO' ? '#1e40af' : '#d97706'
                    }}>
                      {unit.section === 'GEN_SOHO' ? t.genSoho : t.retail}
                    </span>
                  </td>
                  <td style={styles.td}>{unit.price.toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      ...getStatusStyle(unit.stageId)
                    }}>
                      {getStatusLabel(unit.stageId, t)}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPICard({ label, value, subtext, badge, icon }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiTop}>
        <div style={styles.iconBox}>{icon}</div>
        <span style={styles.kpiBadge}>{badge}</span>
      </div>
      <p style={styles.kpiLabel}>{label}</p>
      <p style={styles.kpiValue}>{value}</p>
      <p style={styles.kpiSubtext}>{subtext}</p>
    </div>
  );
}

function ProjectCard({ name, total, booked, sold, t }) {
  const bookedQty = booked.length;
  const bookedValue = booked.reduce((sum, u) => sum + u.price, 0);
  const soldQty = sold.length;
  const soldValue = sold.reduce((sum, u) => sum + u.price, 0);
  const percent = total.qty > 0 ? ((soldQty / total.qty) * 100).toFixed(1) : 0;

  return (
    <div style={styles.card}>
      <h3 style={styles.projectName}>{name}</h3>
      <div style={styles.statsRow}>
        <div>
          <p style={styles.statLabel}>{t.unitsBooked}</p>
          <p style={styles.statValue}>{bookedQty} / {total.qty}</p>
        </div>
        <div>
          <p style={styles.statLabel}>{t.unitsSold}</p>
          <p style={styles.statValue}>{soldQty} / {total.qty}</p>
        </div>
        <div>
          <p style={styles.statLabel}>{t.bookingValue}</p>
          <p style={styles.statValue}>MYR {(bookedValue / 1000000).toFixed(2)}M</p>
        </div>
        <div>
          <p style={styles.statLabel}>{t.soldValue}</p>
          <p style={styles.statValue}>MYR {(soldValue / 1000000).toFixed(2)}M</p>
        </div>
        <div>
          <p style={styles.statLabel}>{t.totalValue}</p>
          <p style={styles.statValue}>MYR {(total.value / 1000000).toFixed(2)}M</p>
        </div>
      </div>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${percent}%` }}></div>
      </div>
      <p style={styles.percentText}>{percent}% {t.sold}</p>
    </div>
  );
}

function isBooked(stageId) {
  return !BOOKING_EXCLUDED_STAGES.includes(stageId);
}

function getStatusLabel(stageId, t) {
  if (stageId === SALES_STAGES.NEW_BOOKING) return t.newBooking;
  if (stageId === 'WON') return t.spaCompleted;
  if (['UC_R4NT7P', 'UC_Z187EH', 'PREPARATION'].includes(stageId)) return t.loanApproval;
  if (['UC_9WW1JI', 'UC_JY92Z7'].includes(stageId)) return t.salesCompleted;
  return t.processing;
}

function getStatusStyle(stageId) {
  if (stageId === SALES_STAGES.NEW_BOOKING) return { background: '#ede9fe', color: '#6d28d9' };
  if (stageId === 'WON') return { background: '#d1fae5', color: '#065f46' };
  if (['UC_R4NT7P', 'UC_Z187EH', 'PREPARATION'].includes(stageId)) return { background: '#dbeafe', color: '#1e40af' };
  if (['UC_9WW1JI', 'UC_JY92Z7'].includes(stageId)) return { background: '#fef3c7', color: '#d97706' };
  return { background: '#f3f4f6', color: '#4b5563' };
}

const styles = {
  container: {
    padding: '32px 40px',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: '100vh',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '16px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #D4AF37',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#6b7280',
    fontWeight: 500,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  label: {
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.05em',
    fontSize: '12px',
    color: '#D4AF37',
    marginBottom: '4px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 800,
    letterSpacing: '-0.025em',
    color: '#111827',
    margin: 0,
  },
  controls: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  select: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
    cursor: 'pointer',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
  toggleGroup: {
    display: 'flex',
    background: '#f3f4f6',
    borderRadius: '12px',
    padding: '4px',
  },
  toggleBtn: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '10px',
    background: 'transparent',
    color: '#4b5563',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toggleActive: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '10px',
    background: '#D4AF37',
    color: 'white',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  kpiCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    animation: 'slideUp 0.4s ease-out',
  },
  kpiTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  iconBox: {
    width: '44px',
    height: '44px',
    background: '#F8F3D8',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiBadge: {
    background: '#F8F3D8',
    color: '#C19B20',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 700,
  },
  kpiLabel: {
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.05em',
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#111827',
    letterSpacing: '-0.025em',
    margin: 0,
  },
  kpiSubtext: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '4px',
  },
  sectionHeader: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
  },
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
  projectName: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '20px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statLabel: {
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.05em',
    fontSize: '10px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#111827',
  },
  progressBar: {
    height: '8px',
    background: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #D4AF37, #C19B20)',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  percentText: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '8px',
    textAlign: 'right',
    fontWeight: 600,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    background: '#f9fafb',
    color: '#6b7280',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #f3f4f6',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background 0.2s ease',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#111827',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
  },
};
