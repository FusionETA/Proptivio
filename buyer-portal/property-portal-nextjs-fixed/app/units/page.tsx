import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSession } from '@/lib/auth';
import { getContactByEmail, getUnitsForContact } from '@/lib/bitrix24';
import { getUnitDetails } from '@/lib/utils';
import { getAllMilestonesForUnit, calculateUnitCompletionPercentage } from '@/lib/milestones';
import { logoutAction } from '../actions/auth';
import styles from './units.module.css';

export default async function UnitsPage() {
  // Check authentication
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  // Get contact and units
  const contact = await getContactByEmail(session.email);
  let units: any[] = [];

  if (contact) {
    const deals = await getUnitsForContact(contact.ID);
    units = deals;
  }

  return (
    <div className={styles.unitsPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon} style={{ fontSize: '0', display: 'flex' }}>
              <Image
                src="/proptivio-logo.svg"
                alt="Proptivio Logo"
                width={40}
                height={40}
                style={{ objectFit: 'contain' }}
              />
            </div>
            <h1>Property Portal</h1>
          </div>
          <div className={styles.userInfo}>
            <Link
              href="/profile"
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--gray-900)',
                textDecoration: 'none',
                marginRight: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--gray-100)',
                borderRadius: '0.5rem',
              }}
            >
              View Profile
            </Link>
            <span className={styles.userEmail}>{session.email}</span>
            <form action={logoutAction}>
              <button type="submit" className={styles.btnLogout}>
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Units</h1>
          <p className={styles.pageSubtitle}>
            View construction progress for your purchased units
          </p>
        </div>

        {contact && units.length > 0 ? (
          <div className={styles.unitsGrid}>
            {units.map((unit) => {
              const details = getUnitDetails(unit);
              return (
                <UnitCard key={details.id} unit={details} />
              );
            })}

            {/* Render Placeholders to fill the grid (multiples of 3) */}
            {(() => {
              const minUnits = 3;
              const currentCount = units.length;
              // Calculate how many total slots we need to fill the last row (or min 3)
              const remainder = currentCount % 3;
              const placeholdersNeeded = remainder === 0
                ? (currentCount < minUnits ? minUnits - currentCount : 0)
                : 3 - remainder;

              // Ensure we at least have minUnits total if needed (e.g. 1 unit -> 2 placeholders)
              const finalPlaceholdersNeeded = Math.max(placeholdersNeeded, minUnits - currentCount > 0 ? minUnits - currentCount : 0);

              return Array.from({ length: finalPlaceholdersNeeded }).map((_, i) => (
                <PlaceholderUnitCard key={`placeholder-${i}`} />
              ));
            })()}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏠</div>
            <h2 className={styles.emptyTitle}>No Units Found</h2>
            <p className={styles.emptyText}>
              {!contact
                ? 'Your email is not registered in our system. Please contact support.'
                : "You don't have any registered units yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Unit Card Component
async function UnitCard({ unit }: { unit: any }) {
  const milestones = await getAllMilestonesForUnit(unit.id);
  const completionPercentage = calculateUnitCompletionPercentage(milestones);

  return (
    <Link href={`/units/${unit.id}`} className={styles.unitCard}>
      <div className={styles.unitHeader}>
        <div className={styles.unitTitle}>{unit.title}</div>
        <div className={styles.unitSubtitle}>Unit ID: #{unit.id}</div>
      </div>
      <div className={styles.unitBody}>
        {/* <div className={styles.unitDetail}>
          <span className={styles.detailLabel}>Tower/Block</span>
          <span className={styles.detailValue}>{unit.tower}</span>
        </div> */}
        <div className={styles.unitDetail}>
          <span className={styles.detailLabel}>Floor</span>
          <span className={styles.detailValue}>{unit.floor}</span>
        </div>
        <div className={styles.unitDetail}>
          <span className={styles.detailLabel}>Unit Number</span>
          <span className={styles.detailValue}>{unit.unit}</span>
        </div>
        <div className={styles.unitDetail}>
          <span className={styles.detailLabel}>Contract Value</span>
          <span className={styles.detailValue}>
            MYR {unit.contract_value}
          </span>
        </div>

        {/* Progress Section */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Construction Progress</span>
            <span className={styles.progressPercentage}>{completionPercentage}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className={styles.btnView}>View Construction Progress →</div>
      </div>
    </Link>
  );
}

function PlaceholderUnitCard() {
  return (
    <div className={`${styles.unitCard} ${styles.placeholderCard}`} style={{ cursor: 'default', borderStyle: 'dashed', background: 'transparent', borderColor: 'var(--gray-300)' }}>
      <div className={styles.unitBody} style={{ height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6, padding: '3rem 1.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'grayscale(1)' }}>🏢</div>
        <div className={styles.unitTitle} style={{ color: 'var(--gray-500)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Your Next Unit</div>
        <div className={styles.unitSubtitle} style={{ textTransform: 'none', color: 'var(--gray-500)' }}>Future Investment</div>
      </div>
    </div>
  );
}
