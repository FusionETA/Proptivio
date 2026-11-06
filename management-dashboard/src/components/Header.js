"use client";
import styles from './Header.module.css';

export default function Header({ title }) {
    return (
        <header className={styles.header}>
            <div className={styles.titleContainer}>
                <h1 className={styles.title}>{title}</h1>
            </div>
            <div className={styles.actions}>
                <div className={styles.search}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input type="text" placeholder="Search anything..." className={styles.searchInput} />
                </div>
                <button className={styles.notificationBtn}>
                    <span className={styles.icon}>🔔</span>
                    <span className={styles.badge}></span>
                </button>
                <button className={styles.profileBtn}>
                    <div className={styles.avatarMini}>JD</div>
                </button>
            </div>
        </header>
    );
}
