# Proptivio Deploy

Deploy scripts to set up the Proptivio property management system on any Bitrix24 account.

## Quick Start

```bash
cd deploy
node setup-bitrix24.js <admin-webhook-url>
```

## What Gets Created

| Item | Type | Description |
|------|------|-------------|
| Sales & Booking | Deal Pipeline | 7 stages: New Booking → SPA Stamping → WON |
| Progressive Billing | Deal Pipeline | 9 stages matching construction milestones |
| Construction Cost | Deal Pipeline | 8 construction milestone stages |
| LOA | Smart Process (SPA) | Letter of Award with custom fields |
| VO | Smart Process (SPA) | Variation Order with type enum field |
| Claims | Smart Process (SPA) | Claims with amount/status fields |
| Gen Soho Units | Product Catalog | 10 sample SOHO units (MYR 380K–525K) |
| Retail Units | Product Catalog | 6 sample retail units (MYR 650K–1.05M) |
| Sample Contacts | CRM Contacts | 5 contacts with different nationalities |
| Sample Deals | CRM Deals | 5 sample bookings + 8 construction milestones |

## Requirements

The setup script needs an **admin-level webhook** because it creates pipelines and SPAs.

### Getting an Admin Webhook

1. Log into `fusion.bitrix24.com` as administrator
2. Left Menu → Developer Resources → Other → Inbound webhooks
3. Click **Add webhook**
4. Enable ALL permissions (especially CRM, Catalog)
5. Copy the webhook URL

### Current Read-Only Webhook

The default webhook (`/rest/152/9kb90xso1fvzdknm/`) belongs to user CY Cheong (ID 152)
who has CRM read access only. It works for the management dashboard (reads data) but
cannot create pipelines or contacts.

## Scripts

```bash
# Set up everything (needs admin webhook)
node setup-bitrix24.js https://fusion.bitrix24.com/rest/1/xxx/

# Reset everything (destructive!)
node reset-bitrix24.js https://fusion.bitrix24.com/rest/1/xxx/
```

## After Setup

The script automatically updates `management-dashboard/src/lib/constants.js` with the
newly created IDs. Then:

```bash
cd ../management-dashboard
npm install
npm run dev
# Open: http://localhost:3000
```

## Output

After running, `setup-output.json` contains all created IDs for reference.
