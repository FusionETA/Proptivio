"use client";

import React, { useState, useEffect } from 'react';
import { getConstructionCostData } from '@/lib/bitrix';
import { Building2, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function ConstructionCostPage() {
    const { t, language, toggleLanguage } = useLanguage();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedMilestones, setExpandedMilestones] = useState({});
    const [expandedLOAs, setExpandedLOAs] = useState({});

    useEffect(() => {
        async function load() {
            try {
                setError(null);
                const d = await getConstructionCostData();
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

    const toggleMilestone = (id) => {
        setExpandedMilestones(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleLOA = (id) => {
        setExpandedLOAs(prev => ({ ...prev, [id]: !prev[id] }));
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

    const totalVariance = data.totalPlanned - data.totalActual;
    const totalVariancePercent = data.totalPlanned > 0 ? ((data.totalActual / data.totalPlanned) * 100).toFixed(1) : 0;

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div>
                    <p style={styles.label}>{t.constructionManagement || "CONSTRUCTION MANAGEMENT"}</p>
                    <h1 style={styles.title}>{t.constructionCost || "Construction Cost"}</h1>
                </div>
                <button onClick={toggleLanguage} style={styles.langToggle}>
                    {language === 'en' ? '中文' : 'EN'}
                </button>
            </header>

            {/* KPI Cards */}
            <div style={styles.kpiGrid}>
                <KPICard
                    label={t.plannedBudget || "PLANNED BUDGET"}
                    value={`${(data.totalPlanned / 1000000).toFixed(2)}M`}
                    subtext="MYR"
                    badge="Total"
                    icon={<Building2 size={22} color="#D4AF37" />}
                />
                <KPICard
                    label={t.actualSpent || "ACTUAL SPENT"}
                    value={`${(data.totalActual / 1000000).toFixed(2)}M`}
                    subtext={`${totalVariancePercent}% ${t.of || "of"} ${t.budget || "budget"}`}
                    badge={`${totalVariancePercent}%`}
                    icon={<TrendingUp size={22} color="#D4AF37" />}
                />
                <KPICard
                    label={t.variance || "VARIANCE"}
                    value={`${(totalVariance / 1000000).toFixed(2)}M`}
                    subtext={totalVariance >= 0 ? (t.underBudget || "Under Budget") : (t.overBudget || "Over Budget")}
                    badge={totalVariance >= 0 ? "✓" : "!"}
                    icon={totalVariance >= 0 ? <TrendingDown size={22} color="#10b981" /> : <TrendingUp size={22} color="#f43f5e" />}
                />
            </div>

            {/* Milestones Table */}
            <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>{t.milestones || "Construction Milestones"}</h2>
            </div>
            <div style={styles.card}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, width: '40%' }}>{t.milestone || "MILESTONE"}</th>
                            <th style={{ ...styles.th, width: '15%' }}>{t.plannedBudget || "PLANNED"}</th>
                            <th style={{ ...styles.th, width: '15%' }}>{t.actualSpent || "ACTUAL"}</th>
                            <th style={{ ...styles.th, width: '15%' }}>{t.variance || "VARIANCE"}</th>
                            <th style={{ ...styles.th, width: '15%' }}>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.milestones.map((milestone) => (
                            <React.Fragment key={milestone.id}>
                                <tr
                                    style={{ ...styles.tr, cursor: 'pointer', background: expandedMilestones[milestone.id] ? '#f9fafb' : 'white' }}
                                    onClick={() => toggleMilestone(milestone.id)}
                                >
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {expandedMilestones[milestone.id] ?
                                                <ChevronDown size={16} color="#6b7280" /> :
                                                <ChevronRight size={16} color="#6b7280" />
                                            }
                                            <span style={{ fontWeight: 600 }}>{milestone.name}</span>
                                            <span style={{ ...styles.badge, background: '#dbeafe', color: '#1e40af', marginLeft: '8px' }}>
                                                {milestone.loas.length} LOAs
                                            </span>
                                        </div>
                                    </td>
                                    <td style={styles.td}>MYR {(milestone.plannedBudget / 1000000).toFixed(2)}M</td>
                                    <td style={styles.td}>MYR {(milestone.actualSpent / 1000000).toFixed(2)}M</td>
                                    <td style={{ ...styles.td, color: milestone.variance >= 0 ? '#10b981' : '#f43f5e' }}>
                                        MYR {(milestone.variance / 1000000).toFixed(2)}M
                                    </td>
                                    <td style={styles.td}>{milestone.variancePercent}%</td>
                                </tr>

                                {/* Expanded LOAs */}
                                {expandedMilestones[milestone.id] && milestone.loas.map((loa) => (
                                    <React.Fragment key={loa.id}>
                                        <tr
                                            style={{ ...styles.tr, background: '#faf5ff' }}
                                            onClick={(e) => { e.stopPropagation(); toggleLOA(loa.id); }}
                                        >
                                            <td style={{ ...styles.td, paddingLeft: '48px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {expandedLOAs[loa.id] ?
                                                        <ChevronDown size={14} color="#9333ea" /> :
                                                        <ChevronRight size={14} color="#9333ea" />
                                                    }
                                                    <span style={{ fontSize: '13px', color: '#7c3aed' }}>
                                                        {loa.title} {loa.number && `(${loa.number})`}
                                                    </span>
                                                    {loa.vos && loa.vos.length > 0 && (
                                                        <span style={{ ...styles.badge, background: '#fef3c7', color: '#d97706', marginLeft: '4px', fontSize: '10px' }}>
                                                            {loa.vos.length} VOs
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ ...styles.td, fontSize: '13px' }}>MYR {(loa.plannedBudget / 1000).toFixed(0)}K</td>
                                            <td style={{ ...styles.td, fontSize: '13px' }}>MYR {(loa.actualSpent / 1000).toFixed(0)}K</td>
                                            <td style={{ ...styles.td, fontSize: '13px', color: (loa.plannedBudget - loa.actualSpent) >= 0 ? '#10b981' : '#f43f5e' }}>
                                                MYR {((loa.plannedBudget - loa.actualSpent) / 1000).toFixed(0)}K
                                            </td>
                                            <td style={{ ...styles.td, fontSize: '13px' }}>
                                                {loa.plannedBudget > 0 ? ((loa.actualSpent / loa.plannedBudget) * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>

                                        {/* Expanded: Show base amount + VO + Claims */}
                                        {expandedLOAs[loa.id] && (
                                            <>
                                                {/* Base LOA Amount Row */}
                                                <tr style={{ ...styles.tr, background: '#f0f9ff' }}>
                                                    <td style={{ ...styles.td, paddingLeft: '64px' }}>
                                                        <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600 }}>
                                                            📋 {t.baseLoaAmount || "Base LOA Amount"}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...styles.td, fontSize: '12px', fontWeight: 600 }}>MYR {loa.baseAmount.toLocaleString()}</td>
                                                    <td style={{ ...styles.td, fontSize: '12px' }}>-</td>
                                                    <td style={{ ...styles.td, fontSize: '12px' }}>-</td>
                                                    <td style={{ ...styles.td, fontSize: '12px' }}>-</td>
                                                </tr>


                                                {/* Individual Variation Orders */}
                                                {loa.vos && loa.vos.length > 0 && (
                                                    <>
                                                        <tr style={{ ...styles.tr, background: '#fffbeb' }}>
                                                            <td colSpan={5} style={{ ...styles.td, paddingLeft: '64px', fontSize: '11px', fontWeight: 600, color: '#d97706', textTransform: 'uppercase' }}>
                                                                📝 {t.variationOrders || "Variation Orders"} ({loa.vos.length})
                                                            </td>
                                                        </tr>
                                                        {loa.vos.map((vo) => {
                                                            const isOmit = vo.type === 90; // number comparison
                                                            return (
                                                                <tr key={vo.id} style={{ ...styles.tr, background: isOmit ? '#fef2f2' : '#fffbeb' }}>
                                                                    <td style={{ ...styles.td, paddingLeft: '80px' }}>
                                                                        <span style={{ fontSize: '12px', color: isOmit ? '#991b1b' : '#d97706' }}>
                                                                            {isOmit ? '➖' : '➕'} {vo.number || vo.title}
                                                                        </span>
                                                                        {vo.description && (
                                                                            <div style={{ fontSize: '10px', color: isOmit ? '#7f1d1d' : '#92400e', marginTop: '2px' }}>
                                                                                {vo.description}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ ...styles.td, fontSize: '12px', fontWeight: 600, color: isOmit ? '#dc2626' : '#d97706' }}>
                                                                        {isOmit ? '-' : '+'}MYR {vo.amount.toLocaleString()}
                                                                    </td>
                                                                    <td style={{ ...styles.td, fontSize: '12px' }}>-</td>
                                                                    <td style={{ ...styles.td, fontSize: '12px' }}>-</td>
                                                                    <td style={{ ...styles.td, fontSize: '12px' }}>-</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </>
                                                )}

                                                {/* Claims Section Header */}
                                                {loa.claims.length > 0 && (
                                                    <tr style={{ ...styles.tr, background: '#fef9e7' }}>
                                                        <td colSpan={5} style={{ ...styles.td, paddingLeft: '64px', fontSize: '11px', fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>
                                                            💰 {t.claims || "Claims"} ({loa.claims.length})
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* Individual Claims */}
                                                {loa.claims.map((claim) => (
                                                    <tr key={claim.id} style={{ ...styles.tr, background: '#fef9e7' }}>
                                                        <td style={{ ...styles.td, paddingLeft: '80px' }}>
                                                            <span style={{ fontSize: '12px', color: '#92400e' }}>
                                                                {claim.title}
                                                            </span>
                                                        </td>
                                                        <td style={{ ...styles.td, fontSize: '12px' }}>-</td>
                                                        <td style={{ ...styles.td, fontSize: '12px' }}>MYR {claim.amount.toLocaleString()}</td>
                                                        <td style={{ ...styles.td, fontSize: '12px' }}>-</td>
                                                        <td style={{ ...styles.td, fontSize: '12px' }}>
                                                            <span style={{
                                                                ...styles.badge,
                                                                background: claim.status === '104' ? '#d1fae5' : claim.status === '102' ? '#dbeafe' : '#f3f4f6',
                                                                color: claim.status === '104' ? '#065f46' : claim.status === '102' ? '#1e40af' : '#4b5563',
                                                                fontSize: '10px'
                                                            }}>
                                                                {claim.status === '104' ? 'Certified' : claim.status === '102' ? 'Submitted' : 'Draft'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
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
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
