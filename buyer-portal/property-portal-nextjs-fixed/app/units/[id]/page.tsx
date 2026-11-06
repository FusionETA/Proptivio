import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getContactByEmail, getDealById, verifyContactAccess } from '@/lib/bitrix24';
import { getUnitDetails } from '@/lib/utils';
import { getAllMilestonesForUnit } from '@/lib/milestones';
import UnitDetailsClient from './UnitDetailsClient';

export default async function UnitDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  // Check authentication
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  // Get contact
  const contact = await getContactByEmail(session.email);

  if (!contact) {
    redirect('/?error=contact_not_found');
  }

  // Get unit deal
  const deal = await getDealById(params.id);

  if (!deal) {
    redirect('/units?error=unit_not_found');
  }

  // Verify access
  const hasAccess = await verifyContactAccess(params.id, contact.ID);

  if (!hasAccess) {
    redirect('/units?error=access_denied');
  }

  // Get unit details and milestones
  const unitDetails = getUnitDetails(deal);
  const milestones = await getAllMilestonesForUnit(params.id);

  // Filter completed/in-progress milestones for photos tab
  const completedMilestones = milestones.filter(
    (m) => m.status === 'Completed' || m.status === 'In Progress'
  );

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #f3f4f6',
          padding: '1rem 0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/units"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              background: 'transparent',
              color: '#4b5563',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '700',
              transition: 'all 0.2s',
            }}
          >
            ← Back to Units
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Hero Card */}
        <div
          style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            border: '1px solid #f3f4f6',
            marginBottom: '2rem',
          }}
        >
          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: '800',
              letterSpacing: '-0.025em',
              marginBottom: '1.5rem',
              color: '#111827',
            }}
          >
            {unitDetails.title}
          </h1>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#6b7280',
                  marginBottom: '0.25rem',
                  fontWeight: '600',
                }}
              >
                Tower/Block
              </label>
              <div
                style={{
                  fontSize: '1.5rem',
                  color: '#111827',
                  fontWeight: '700',
                  letterSpacing: '-0.025em',
                }}
              >
                {unitDetails.tower}
              </div>
            </div> */}

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#6b7280',
                  marginBottom: '0.25rem',
                  fontWeight: '600',
                }}
              >
                Floor
              </label>
              <div
                style={{
                  fontSize: '1.5rem',
                  color: '#111827',
                  fontWeight: '700',
                  letterSpacing: '-0.025em',
                }}
              >
                {unitDetails.floor}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#6b7280',
                  marginBottom: '0.25rem',
                  fontWeight: '600',
                }}
              >
                Unit Number
              </label>
              <div
                style={{
                  fontSize: '1.5rem',
                  color: '#111827',
                  fontWeight: '700',
                  letterSpacing: '-0.025em',
                }}
              >
                {unitDetails.unit}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#6b7280',
                  marginBottom: '0.25rem',
                  fontWeight: '600',
                }}
              >
                Contract Value
              </label>
              <div
                style={{
                  fontSize: '1.5rem',
                  color: '#111827',
                  fontWeight: '700',
                  letterSpacing: '-0.025em',
                }}
              >
                MYR {unitDetails.contract_value}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Content - Client Component */}
        <UnitDetailsClient
          milestones={milestones}
          completedMilestones={completedMilestones}
        />
      </div>
    </div>
  );
}
