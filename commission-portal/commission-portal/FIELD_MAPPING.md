# Field Mapping - CORRECTED

## ✅ All Field Mappings Fixed

Based on the Bitrix API response, all field mappings have been corrected:

### **Transaction Pipeline (categoryId: 42)**

| Field Name | Symbolic Code | Data Type | Portal Usage |
|------------|---------------|-----------|--------------|
| Process Date | `ufCrm22_1768766656894` | date | Transaction processing date |
| Transaction Date | `ufCrm22_1768766664474` | date | When transaction occurred |
| Account No | `ufCrm22_1768766679650` | string | Primary identifier |
| Buyer Name (Customer) | `ufCrm22_1768766697650` | string | Customer name |
| Project/Developer Name | `ufCrm22_1768766717249` | string | Project name |
| Transaction Amount | `ufCrm22_1768766794874` | string | Total transaction value |
| Commission Rate | `ufCrm22_1768766825967` | string | Commission percentage |
| Commission Amount | `ufCrm22_1768766833832` | string | Total commission |
| Developer's Rate | `ufCrm22_1768766852877` | string | Developer split % |
| Developer's Income | `ufCrm22_1768766866722` | string | Developer portion |
| Developer's Payable Income | `ufCrm22_1768766880346` | string | Developer payout |
| Agent's Rate | `ufCrm22_1768766903332` | string | Agent split % |
| Agent's Income | `ufCrm22_1768766910938` | string | Agent portion |
| Agent's Payable Income | `ufCrm22_1768766920678` | string | Agent payout |
| Deal ID | `ufCrm22_1768766962674` | string | Original deal reference |
| Transaction Record (Parent) | `ufCrm22_1768766975154` | string | Parent record link |
| Error Message | `ufCrm22_1768766996931` | string | Error details |
| Approval Status | `ufCrm22_1768757229479` | string | PENDING/APPROVED |

### **Statement Record Pipeline (categoryId: 46)**

| Field Name | Symbolic Code | Data Type | Portal Usage |
|------------|---------------|-----------|--------------|
| Transaction Record (Parent) | `ufCrm22_1768766975154` | string | Link to parent transaction |
| Process Date | `ufCrm22_1768766656894` | date | Processing date |
| Transaction Date | `ufCrm22_1768766664474` | date | Transaction date |
| Account No | `ufCrm22_1768766679650` | string | Account identifier |
| Buyer Name (Customer) | `ufCrm22_1768766697650` | string | Customer name |
| Project/Developer Name | `ufCrm22_1768766717249` | string | Project name |
| Transaction Amount | `ufCrm22_1768766794874` | string | Transaction value |
| Commission Rate | `ufCrm22_1768766825967` | string | Commission % |
| **Income** | `ufCrm22_1768767232875` | string | **Agent/Developer income** |
| Approval Status | `ufCrm22_1768757229479` | string | PENDING/APPROVED |

## 🔑 Key Differences

### **Transaction Pipeline vs Statement Record Pipeline**

**Transaction Pipeline has:**
- Commission Amount (total)
- Developer's Rate, Income, Payable Income
- Agent's Rate, Income, Payable Income
- Deal ID
- Error Message

**Statement Record Pipeline has:**
- **Income** field (`ufCrm22_1768767232875`) - This is the key field for agent/developer earnings

## 📊 Portal Display Logic

### **Overview Page (Transactions)**
Shows Transaction pipeline records with:
- Account No
- Transaction Date
- Buyer Name
- Project
- Transaction Amount
- Commission Rate
- Commission Amount
- Income (uses `income` or falls back to `agentIncome`)

### **Agents Page**
Groups Statement Records by `title` (agent/developer name):
- Uses `income` field for commission calculations
- Shows total sales and total income per agent

### **Agent View Page (Statements)**
Shows Statement Record pipeline with:
- Process Date
- Transaction Date
- Account No
- Buyer Name
- Project/Developer Name
- Transaction Amount
- Commission Rate
- **Income** (`ufCrm22_1768767232875`)
- Status
- Approve button

## ✅ What Was Fixed

1. **Account No**: Changed from `ufCrm22_1768766717249` to `ufCrm22_1768766679650`
2. **Buyer Name**: Changed from `ufCrm22_1768766794874` to `ufCrm22_1768766697650`
3. **Project/Developer**: Changed from `ufCrm22_1768766825967` to `ufCrm22_1768766717249`
4. **Transaction Amount**: Changed from `ufCrm22_1768766833832` to `ufCrm22_1768766794874`
5. **Commission Rate**: Changed from `ufCrm22_1768766903332` to `ufCrm22_1768766825967`
6. **Commission Amount**: Changed from `ufCrm22_1768766910938` to `ufCrm22_1768766833832`
7. **Developer Rate**: Changed from `ufCrm22_1768766920678` to `ufCrm22_1768766852877`
8. **Developer Income**: Changed from `ufCrm22_1768766975154` to `ufCrm22_1768766866722`
9. **Added Developer Payable Income**: `ufCrm22_1768766880346`
10. **Added Agent Rate**: `ufCrm22_1768766903332`
11. **Added Agent Income**: `ufCrm22_1768766910938`
12. **Added Agent Payable Income**: `ufCrm22_1768766920678`
13. **Added Deal ID**: `ufCrm22_1768766962674`
14. **Added Transaction Record Parent**: `ufCrm22_1768766975154`
15. **Added Error Message**: `ufCrm22_1768766996931`
16. **Added Income field**: `ufCrm22_1768767232875` (Statement Record specific)

## 🎯 Testing Checklist

- [ ] Overview page shows correct Account No
- [ ] Buyer Name displays correctly (not transaction amount)
- [ ] Project/Developer Name shows correctly
- [ ] Transaction Amount is correct
- [ ] Commission Rate displays as percentage
- [ ] Commission Amount shows correctly
- [ ] Statement Records show Income field
- [ ] Agent calculations use Income field
- [ ] All fields map to correct Bitrix symbolic codes

## 📝 Notes

- **Income field** (`ufCrm22_1768767232875`) is ONLY in Statement Record pipeline
- **Commission Amount** is in Transaction pipeline
- Portal intelligently uses the correct field based on context
- All numeric fields are parsed as floats for calculations
- All date fields are formatted for display
