# Bitrix24 API Integration Guide

## Overview
This commission portal integrates with Bitrix24 SPA (Smart Process Automation) to retrieve and manage commission transactions and statement records.

## Architecture

### Backend API Layer (`/app/api/bitrix/`)
- **`/api/bitrix/transactions`** - GET all Transaction records (categoryId: 42)
- **`/api/bitrix/statements`** - GET all Statement Records (categoryId: 46)
- **`/api/bitrix/statements/[id]`** - GET/PATCH single Statement Record

### Service Layer (`/lib/bitrix/`)
- **`client.ts`** - Bitrix24 API client with webhook integration
- **`config.ts`** - Configuration constants (entity types, categories, field mappings)
- **`types.ts`** - TypeScript interfaces for Bitrix data structures
- **`utils.ts`** - Helper functions for data mapping and formatting

### Frontend Service (`/lib/services/`)
- **`bitrix-service.ts`** - Frontend service to call backend API routes

## Configuration

### Bitrix24 Setup
- **Webhook URL**: `https://fusion.bitrix24.com/rest/18/cbmmez2raqrmlucg`
- **SPA Entity Type ID**: `1070`
- **Pipelines (Categories)**:
  - `42` = Transaction
  - `46` = Statement Record
  - `48` = Approval (optional)

### Field Mappings
All custom fields are mapped in `/lib/bitrix/config.ts`:

```typescript
PROCESS_DATE: 'ufCrm22_1768766656894'
TRANSACTION_DATE: 'ufCrm22_1768766664474'
ACCOUNT_NO: 'ufCrm22_1768766717249'
BUYER_NAME: 'ufCrm22_1768766794874'
PROJECT_DEVELOPER: 'ufCrm22_1768766825967'
TRANSACTION_AMOUNT: 'ufCrm22_1768766833832'
COMMISSION_RATE: 'ufCrm22_1768766903332'
COMMISSION_AMOUNT: 'ufCrm22_1768766910938'
DEVELOPER_RATE: 'ufCrm22_1768766920678'
DEVELOPER_INCOME: 'ufCrm22_1768766975154'
APPROVAL_STATUS: 'ufCrm22_1768757229479'
```

## API Usage Examples

### 1. Fetch All Transactions (Overview Page)
```typescript
import { bitrixService } from '@/lib/services/bitrix-service';

// Get all transactions
const data = await bitrixService.getTransactions();

// With date filter
const filtered = await bitrixService.getTransactions({
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});
```

### 2. Fetch Statement Records (Agent Page)
```typescript
// By agent name
const statements = await bitrixService.getStatements({
  agentName: 'John Doe'
});

// By account number
const statements = await bitrixService.getStatements({
  accountNo: 'ACC-001'
});
```

### 3. Get Single Statement
```typescript
const statement = await bitrixService.getStatement(9007);
```

### 4. Approve Statement
```typescript
// Approve with current date
await bitrixService.approveStatement(9007);

// Approve with specific date
await bitrixService.approveStatement(9007, '2026-01-19');
```

## Business Flow

### Important Notes
1. **Portal DOES NOT create transactions** - Bitrix automation handles this
2. **Portal DOES NOT create statement records** - Bitrix splits transactions automatically
3. **Portal ONLY**:
   - Retrieves data (read-only for transactions)
   - Updates approval status on statement records
   - Generates PDF/CSV exports from retrieved data

### Data Flow
```
Bitrix Deal Completed
    ↓
Bitrix Auto-creates Transaction (categoryId: 42)
    ↓
Bitrix Auto-splits into Statement Records (categoryId: 46)
    ↓
Portal displays Statement Records to agents
    ↓
Agent submits for approval (portal updates status)
    ↓
Backoffice approves (portal updates status + process date)
    ↓
Agent downloads/exports statement (portal generates PDF/CSV)
```

## Agent Identification

Since agents are not Bitrix users, we recommend using **Account Number** (`ufCrm22_1768766717249`) as the unique identifier for agent login/filtering.

Alternative: Use **Buyer Name** (`ufCrm22_1768766794874`) if agents have consistent name records.

## Error Handling

The API layer is intentionally simple with minimal error handling to avoid complexity. Errors from Bitrix24 are passed through directly:

```typescript
if (data.error) {
  throw new Error(data.error_description || data.error);
}
```

## Next Steps

To integrate with frontend pages:

1. **Update Overview page** (`/app/page.tsx`) to use `bitrixService.getTransactions()`
2. **Update Agent page** (`/app/agent/[id]/page.tsx`) to use `bitrixService.getStatements()`
3. **Add approval button** to statement records
4. **Implement PDF/CSV export** using retrieved data

## Testing

Test the API endpoints directly:

```bash
# Get transactions
curl http://localhost:3000/api/bitrix/transactions

# Get statements for an agent
curl http://localhost:3000/api/bitrix/statements?agentName=John%20Doe

# Get single statement
curl http://localhost:3000/api/bitrix/statements/9007

# Approve statement
curl -X PATCH http://localhost:3000/api/bitrix/statements/9007 \
  -H "Content-Type: application/json" \
  -d '{"approvalStatus":"APPROVED","processDate":"2026-01-19"}'
```
