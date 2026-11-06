# Bitrix Integration - Quick Start Guide

## ✅ What's Been Integrated

The entire portal has been updated to work with real Bitrix24 data:

### 📊 **Overview Page** (`/`)
- Fetches all **Transaction records** (categoryId: 42) from Bitrix
- Displays real-time statistics (Total Commission, Pending, Approved)
- Refresh button to reload data
- Click on Deal ID to view transaction details

### 👥 **Agents Page** (`/agents`)
- Fetches all **Statement Records** (categoryId: 46) from Bitrix
- Groups records by agent (using Buyer Name or Account Number)
- Shows total sales and commission per agent
- Click on agent card to view their statements

### 📄 **Agent View Page** (`/agent/[id]`)
- Displays all statement records for a specific agent
- Shows summary: Total Earnings, Approved Income, Pending Approval
- **✨ APPROVE BUTTON** - Click to approve individual statements
- Automatically updates Bitrix with approval status and process date

### 🔍 **Transaction Detail Page** (`/transaction/[id]`)
- Shows complete transaction information
- Displays all Bitrix fields properly formatted

## 🚀 How to Test

### 1. Start the Development Server
```bash
cd commission-portal
npm run dev
```

### 2. Test Overview Page
1. Open http://localhost:3000
2. You should see transactions from Bitrix SPA (categoryId: 42)
3. Click "Refresh" to reload data
4. Check if statistics are calculating correctly

### 3. Test Agents Page
1. Click "Agents" in the sidebar
2. You should see agent cards grouped from statement records
3. Click on an agent card

### 4. Test Agent View & Approval
1. On the agent page, you'll see all their statement records
2. Find a record with "PENDING" status
3. Click the **"Approve"** button
4. The status should change to "APPROVED"
5. The record in Bitrix will be updated with:
   - `ufCrm22_1768757229479` = "APPROVED"
   - `ufCrm22_1768766656894` = current date (process date)

### 5. Verify in Bitrix24
1. Go to your Bitrix24 SPA
2. Find the Statement Record you approved
3. Check that the Approval Status field is now "APPROVED"
4. Check that the Process Date is set to today's date

## 🔧 API Endpoints Available

### GET `/api/bitrix/transactions`
Fetch all transactions (categoryId: 42)
```
Query params:
- startDate (optional): Filter by transaction date >= this date
- endDate (optional): Filter by transaction date <= this date
- start (optional): Pagination offset
```

### GET `/api/bitrix/statements`
Fetch all statement records (categoryId: 46)
```
Query params:
- agentName (optional): Filter by buyer name
- accountNo (optional): Filter by account number
- start (optional): Pagination offset
```

### GET `/api/bitrix/statements/[id]`
Get single statement record

### PATCH `/api/bitrix/statements/[id]`
Update statement (for approval)
```json
{
  "approvalStatus": "APPROVED",
  "processDate": "2026-01-19"
}
```

## 🎯 Key Features Implemented

✅ **Real-time data** from Bitrix24 SPA  
✅ **Automatic data mapping** from Bitrix field names to readable properties  
✅ **Loading states** with spinner animations  
✅ **Refresh functionality** on all pages  
✅ **Approval workflow** - Update status directly from portal  
✅ **Error handling** - Console logs for debugging  
✅ **Proper formatting** - Currency (RM), dates, status badges  

## 📝 Important Notes

1. **Portal does NOT create records** - Only reads and updates approval status
2. **Agent identification** - Currently using Account Number or Buyer Name
3. **Approval process** - Sets status to "APPROVED" and records process date
4. **No authentication yet** - All pages are publicly accessible

## 🐛 Troubleshooting

### No data showing?
- Check browser console for errors
- Verify webhook URL is correct in `/lib/bitrix/config.ts`
- Make sure Bitrix SPA has records in the correct categories

### Approval not working?
- Check browser console for API errors
- Verify the statement ID exists in Bitrix
- Check that the field `ufCrm22_1768757229479` exists and is writable

### Wrong data displayed?
- Verify field mappings in `/lib/bitrix/config.ts`
- Check that Bitrix field IDs match your SPA configuration

## 📚 Next Steps

1. **Add authentication** - Implement agent login using account number
2. **PDF/CSV export** - Generate downloadable statements
3. **Date filtering** - Add date range picker on overview page
4. **Pagination** - Handle large datasets with pagination
5. **Multi-step approval** - Add workflow for internal staff approval

## 🔗 Documentation Files

- `BITRIX_API_GUIDE.md` - Detailed API documentation
- `/lib/bitrix/config.ts` - Configuration and field mappings
- `/lib/services/bitrix-service.ts` - Frontend service layer
