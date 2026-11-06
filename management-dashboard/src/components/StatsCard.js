"use client";
import styles from './StatsCard.module.css';

export default function StatsCard({ title, value, trend, icon, color }) {
    const isPositive = trend.startsWith('+');

    return (
        <div className="card">
            <div className={styles.header}>
                <div className={styles.iconWrapper} style={{ backgroundColor: `${color}20`, color: color }}>
                    {icon}
                </div>
                <div className={`${styles.trend} ${isPositive ? styles.positive : styles.negative}`}>
                    {trend}
                </div>
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.value}>{value}</p>
            </div>
        </div>
    );
}
