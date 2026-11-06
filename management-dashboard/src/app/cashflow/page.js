"use client";

import React, { useState, useEffect } from 'react';
import { getCashflowData } from '@/lib/bitrix';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function CashflowPage() {
    const { t, language, toggleLanguage } = useLanguage();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedUnits, setExpandedUnits] = useState({});
    const [selectedView, setSelectedView] = useState('ALL');

    useEffect(() => {
        async function load() {
            try {
                setError(null);
                const d = await getCashflowData();
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

    const toggleUnit = (id) => {
        setExpandedUnits(prev => ({ ...prev, [id]: !prev[id] }));
    };

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

    // Filter money in by selected milestone stage
    const filteredMoneyIn = selectedView === 'ALL'
        ? data.totalMoneyIn
        : data.milestoneStageSummary
            .filter(ms => ms.stageId === selectedView)
            .reduce((sum, ms) => sum + ms.moneyIn, 0);

    const netCashflow = data.totalMoneyIn - data.totalMoneyOut;

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div>
                    <p style={styles.label}>{t.cashflowManagement}</p>
                    <h1 style={styles.title}>{t.cashflowTitle}</h1>
                </div>
                <div style={styles.controls}>
                    <button onClick={toggleLanguage} style={styles.langToggle}>
                        {language === 'en' ? '中文' : 'EN'}
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div style={styles.kpiGrid}>
                <KPICard
                    label={t.moneyOut}
                    value={`${(data.totalMoneyOut / 1000000).toFixed(2)}M`}
                    subtext={`${t.claimsPaidOut} (MYR)`}
                    badge={data.totalPlanned > 0 ? `${((data.totalMoneyOut / data.totalPlanned) * 100).toFixed(1)}%` : '0%'}
                    icon={<ArrowUpCircle size={22} color="#f43f5e" />}
                    accentColor="#fef2f2"
                    accentText="#991b1b"
                />
                <KPICard
                    label={t.moneyIn}
                    value={`${(data.totalMoneyIn / 1000000).toFixed(2)}M`}
                    subtext={`${t.invoicedToBuyers} (MYR)`}
                    badge={`${data.billingDeals.length} ${t.units}`}
                    icon={<ArrowDownCircle size={22} color="#10b981" />}
                    accentColor="#ecfdf5"
                    accentText="#065f46"
                />
                <KPICard
                    label={t.netCashflow}
                    value={`${(netCashflow / 1000000).toFixed(2)}M`}
                    subtext={netCashflow >= 0 ? t.positive : t.negative}
                    badge={netCashflow >= 0 ? "+" : "-"}
                    icon={netCashflow >= 0
                        ? <TrendingUp size={22} color="#10b981" />
                        : <TrendingDown size={22} color="#f43f5e" />
                    }
                    accentColor={netCashflow >= 0 ? "#ecfdf5" : "#fef2f2"}
                    accentText={netCashflow >= 0 ? "#065f46" : "#991b1b"}
                />
                <KPICard
                    label={t.totalPlannedBudget}
                    value={`${(data.totalPlanned / 1000000).toFixed(2)}M`}
                    subtext="MYR"
                    badge="Total"
                    icon={<Building2 size={22} color="#D4AF37" />}
                    accentColor="#F8F3D8"
                    accentText="#C19B20"
                />
            </div>

            {/* Milestone Stage Summary - Money In per stage vs Money Out */}
            <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>{t.milestoneBreakdown} — {t.moneyIn} vs {t.moneyOut}</h2>
            </div>
            <div style={styles.card}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, width: '4%' }}>#</th>
                            <th style={{ ...styles.th, width: '30%' }}>{t.milestone}</th>
                            <th style={{ ...styles.th, width: '6%' }}>%</th>
                            <th style={{ ...styles.th, width: '20%' }}>{t.moneyIn} (MYR)</th>
                            <th style={{ ...styles.th, width: '20%' }}>{t.moneyOut} (MYR)</th>
                            <th style={{ ...styles.th, width: '20%' }}>{t.netCashflow} (MYR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.milestoneStageSummary.map((ms, idx) => {
                            const net = ms.moneyIn - ms.moneyOut;
                            return (
                                <tr key={ms.stageId} style={{ ...styles.tr, background: ms.moneyIn > 0 ? '#f0fdf4' : 'white' }}>
                                    <td style={{ ...styles.td, color: '#6b7280', fontWeight: 600 }}>{idx + 1}</td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 600 }}>{ms.label}</span>
                                            {ms.moneyIn > 0 && (
                                                <span style={{ ...styles.badge, background: '#d1fae5', color: '#065f46', fontSize: '10px' }}>
                                                    {t.invoicesIssued || 'Invoiced'}
                                                </span>
                                            )}
                                            {ms.claimCount > 0 && (
                                                <span style={{ ...styles.badge, background: '#fef3c7', color: '#d97706', fontSize: '10px' }}>
                                                    {ms.claimCount} {t.claims}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ ...styles.td, color: '#7c3aed', fontWeight: 700 }}>
                                        {ms.percent}%
                                    </td>
                                    <td style={{ ...styles.td, color: ms.moneyIn > 0 ? '#10b981' : '#9ca3af', fontWeight: 600 }}>
                                        {ms.moneyIn > 0 ? `MYR ${Math.round(ms.moneyIn).toLocaleString()}` : '-'}
                                    </td>
                                    <td style={{ ...styles.td, color: ms.moneyOut > 0 ? '#f43f5e' : '#9ca3af', fontWeight: 600 }}>
                                        {ms.moneyOut > 0 ? `MYR ${Math.round(ms.moneyOut).toLocaleString()}` : '-'}
                                    </td>
                                    <td style={{ ...styles.td, fontWeight: 600, color: (ms.moneyIn === 0 && ms.moneyOut === 0) ? '#9ca3af' : (net >= 0 ? '#10b981' : '#f43f5e') }}>
                                        {(ms.moneyIn === 0 && ms.moneyOut === 0) ? '-' : `MYR ${Math.round(net).toLocaleString()}`}
                                    </td>
                                </tr>
                            );
                        })}
                        {/* Total Row */}
                        <tr style={{ ...styles.tr, background: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                            <td style={styles.td}></td>
                            <td style={{ ...styles.td, fontWeight: 700 }}>Total</td>
                            <td style={{ ...styles.td, fontWeight: 700, color: '#7c3aed' }}>95%</td>
                            <td style={{ ...styles.td, fontWeight: 700, color: '#10b981' }}>
                                MYR {Math.round(data.totalMoneyIn).toLocaleString()}
                            </td>
                            <td style={{ ...styles.td, fontWeight: 700, color: '#f43f5e' }}>
                                MYR {Math.round(data.totalMoneyOut).toLocaleString()}
                            </td>
                            <td style={{ ...styles.td, fontWeight: 700, color: netCashflow >= 0 ? '#10b981' : '#f43f5e' }}>
                                MYR {Math.round(netCashflow).toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Progressive Billing - Per Unit Breakdown */}
            <div style={{ ...styles.sectionHeader, marginTop: '32px' }}>
                <h2 style={styles.sectionTitle}>{t.progressiveBilling} — {t.moneyIn} {t.unit} {t.milestoneBreakdown || 'Breakdown'}</h2>
            </div>
            <div style={styles.card}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, width: '25%' }}>{t.unit}</th>
                            <th style={{ ...styles.th, width: '15%' }}>{t.price} (MYR)</th>
                            <th style={{ ...styles.th, width: '15%' }}>{t.bookingFee || 'Booking Fee'}</th>
                            <th style={{ ...styles.th, width: '15%' }}>{t.currentStage || 'Current Stage'}</th>
                            <th style={{ ...styles.th, width: '15%' }}>{t.moneyIn} (MYR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.billingDeals.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#6b7280' }}>
                                    {t.noData}
                                </td>
                            </tr>
                        ) : (
                            data.billingDeals.map((deal) => (
                                <React.Fragment key={deal.id}>
                                    <tr
                                        style={{ ...styles.tr, cursor: 'pointer', background: expandedUnits[deal.id] ? '#f9fafb' : 'white' }}
                                        onClick={() => toggleUnit(deal.id)}
                                    >
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {expandedUnits[deal.id] ?
                                                    <ChevronDown size={14} color="#6b7280" /> :
                                                    <ChevronRight size={14} color="#6b7280" />
                                                }
                                                <span style={{ fontWeight: 600 }}>{deal.title}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            {deal.fullPrice.toLocaleString()}
                                        </td>
                                        <td style={styles.td}>
                                            {Math.round(deal.bookingFee).toLocaleString()}
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.badge,
                                                background: deal.milestonesReached > 0 ? '#dbeafe' : '#f3f4f6',
                                                color: deal.milestonesReached > 0 ? '#1e40af' : '#6b7280'
                                            }}>
                                                {deal.stageLabel} ({deal.milestonesReached}/8)
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, color: '#10b981', fontWeight: 700 }}>
                                            {Math.round(deal.moneyIn).toLocaleString()}
                                        </td>
                                    </tr>

                                    {/* Expanded: show per-milestone breakdown with percentages */}
                                    {expandedUnits[deal.id] && (
                                        <>
                                            {deal.milestoneBreakdown.map((mb, idx) => (
                                                <tr key={mb.stageId} style={{ ...styles.tr, background: mb.invoiced ? '#f0fdf4' : '#fafafa' }}>
                                                    <td style={{ ...styles.td, paddingLeft: '48px', fontSize: '12px' }}>
                                                        <span style={{ color: mb.invoiced ? '#065f46' : '#9ca3af' }}>
                                                            {mb.invoiced ? '\u2705' : '\u23F3'} {idx + 1}. {mb.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...styles.td, fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>
                                                        {mb.percent}%
                                                    </td>
                                                    <td style={{ ...styles.td, fontSize: '12px', fontWeight: 600, color: mb.invoiced ? '#111827' : '#d1d5db' }}>
                                                        MYR {Math.round(mb.amount).toLocaleString()}
                                                    </td>
                                                    <td style={{ ...styles.td, fontSize: '12px' }}>
                                                        <span style={{
                                                            ...styles.badge,
                                                            fontSize: '10px',
                                                            background: mb.invoiced ? '#d1fae5' : '#f3f4f6',
                                                            color: mb.invoiced ? '#065f46' : '#9ca3af'
                                                        }}>
                                                            {mb.invoiced ? (t.invoicesIssued || 'Invoiced') : (t.pending || 'Pending')}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...styles.td, fontSize: '12px', fontWeight: 600, color: mb.invoiced ? '#10b981' : '#d1d5db' }}>
                                                        {mb.invoiced ? `MYR ${Math.round(mb.amount).toLocaleString()}` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

function KPICard({ label, value, subtext, badge, icon, accentColor, accentText }) {
    return (
        <div style={styles.kpiCard}>
            <div style={styles.kpiTop}>
                <div style={{ ...styles.iconBox, background: accentColor || '#F8F3D8' }}>{icon}</div>
                <span style={{ ...styles.kpiBadge, background: accentColor || '#F8F3D8', color: accentText || '#C19B20' }}>{badge}</span>
            </div>
            <p style={styles.kpiLabel}>{label}</p>
            <p style={styles.kpiValue}>{value}</p>
            <p style={styles.kpiSubtext}>{subtext}</p>
        </div>
    );
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
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    controls: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
    },
    langToggle: {
        background: '#F8F3D8',
        border: '2px solid #D4AF37',
        color: '#C19B20',
        padding: '8px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
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
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
    },
    kpiCard: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
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
    card: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
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
