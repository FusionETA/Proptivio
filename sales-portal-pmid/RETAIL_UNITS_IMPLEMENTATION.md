# Retail Units Module - Implementation Guide

## Overview
This document describes the implementation of the new Retail Units module in the Sales Portal.

## What Was Implemented

### 1. Backend Changes

#### A. Field Mapping (`src/lib/fieldMapping.js`)
- Added `retailEnums` configuration for retail-specific properties:
  - **Floor** (property112): Maps to retail floor levels (2, 3, 4)
  - **Sqft** (property116): Retail-specific square footage values
  - **Area** (property124): Area in different units
  - **Sqm** (property126): Square meter measurements

#### B. Bitrix24 Service (`src/lib/bitrix24.js`)
Added three new methods:

1. **`getRetailUnits()`**: 
   - Fetches retail units using a two-API approach:
     - **First API**: `catalog.product.list` - Gets product details (filter: iblockId=14, iblockSectionId=52)
     - **Second API**: `catalog.price.list` - Gets prices for all products
   - Handles pagination for both API calls
   - Maps prices using `catalogGroupId: 2`

2. **`transformRetailUnitsData()`**:
   - Transforms raw API data into frontend-friendly format
   - Maps all retail-specific fields (Floor, Size, Sqft, PSF, PSM, Area, Sqm)
   - Marks units with `unitCategory: 'retail'` and `viewOrientation: 'retail'`

3. **Updated `transformUnitsData()`**:
   - Added `unitCategory: 'soho'` to differentiate SOHO units

#### C. API Route (`src/app/api/units/route.js`)
- Added support for fetching both SOHO and Retail units
- Accepts optional `category` query parameter: `'soho'`, `'retail'`, or `'all'`
- Fetches both unit types in parallel when `category='all'` (default)

### 2. Frontend Changes

#### A. Main Page (`src/app/page.js`)
- **Updated Navigation**: 
  - Removed "All Units" (Overview) tab from main sequence
  - Implemented **Collapsible SOHO Section**: Clicking "SOHO Units" reveals a horizontal scrollable bar of view options (Southeast, Northwest, etc.)
  - **Retail Units** available as a distinct primary tab
- **State Management**: Added `sohoActiveView` to track the selected view within the SOHO section

#### B. Components

**New Component: `RetailUnitCard.jsx`**
- Specialized card component for retail units
- **Teal Color Scheme**: Uses calming teal/cyan colors to differentiate from SOHO (Blue/Gray)
- **Retail Fields**:
  - **Type**: Displays unit type (e.g., A, B1) - *Shared with SOHO*
  - **Area (RM)**: Displays price-related area value (Property 122)
  - **Sqft/Sqm**: Physical dimensions
  - **Size**: Dimensions string (e.g., 20' x 70')
  - **PSF/PSM**: Price per square foot/meter statistics

**Updated: `UnitGrid.jsx`**
- Updates legend to use **Teal** for Retail units availability indicator
- Conditionally renders `RetailUnitCard`

**Updated: `BookingForm.jsx`**
- Updates badges to use **Teal** color scheme for Retail units
- Displays **Type** and **Area (RM)** fields in the booking summary


### 3. UI/UX Design Decisions

#### Navigation Structure
```
Tabs: [Overview] [Southeast View] [Northwest View] [Retail Units]
```

#### Visual Differentiation
- **SOHO Units**: Blue/Gray color scheme, view-oriented grouping
- **Retail Units**: Purple color scheme, no view orientation
- **Legend**: Purple dot for available retail units vs. white dot for SOHO

#### Data Display
- Retail units displayed in grid format, grouped by floor
- Floor-based organization (descending order)
- No southeast/northwest categorization for retail units

## API Structure

### Retail Units - First API Call
```javascript
POST: https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/catalog.product.list

Body:
{
  "order": { "id": "ASC" },
  "filter": { 
    "iblockId": 14, 
    "iblockSectionId": 52 
  },
  "select": [
    "id", "name", "iblockId", "iblockSectionId",
    "property106", // Type
    "property108", // Status
    "property112", // Floor (Retail)
    "property114", // Size (Retail)
    "property116", // Sqft (Retail)
    "property118", // PSF (RM)
    "property120", // PSM (RM)
    "property122", // Area (RM)
    "property124", // Area (Retail)
    "property126"  // Sqm (Retail)
  ],
  "start": 0
}
```

### Retail Units - Second API Call (Prices)
```javascript
POST: https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/catalog.price.list

Body:
{
  "filter": {
    "@productId": [942, 944, 946, ...] // IDs from first API
  },
  "select": ["id", "productId", "catalogGroupId", "price", "currency"],
  "order": { "productId": "ASC", "catalogGroupId": "ASC" },
  "start": 0
}
```

## Property to Field Mapping

| Bitrix Property | Field Name | Type | Description |
|----------------|------------|------|-------------|
| property106 | Type | Enum | Unit type (A, B1, B2, C, D) - shared with SOHO |
| property108 | Status | Enum | Availability status - shared with SOHO |
| property112 | Floor | Enum | Floor level (2, 3, 4) |
| property114 | Size | String | Physical size (e.g., "20' X 73'") |
| property116 | Sqft | Enum | Square footage |
| property118 | PSF | Number | Price per square foot (RM) |
| property120 | PSM | Number | Price per square meter (RM) |
| property122 | Area (RM) | Number | Total area price (RM) |
| property124 | Area | Enum | Area value |
| property126 | Sqm | Enum | Square meters |

## Testing the Implementation

1. **View Retail Units**:
   - Navigate to the "Retail Units" tab
   - Verify units are displayed with purple styling
   - Check that retail-specific fields appear correctly

2. **Select and Book Retail Units**:
   - Select one or more retail units
   - Click "Book Now"
   - Verify booking form shows retail fields (Sqft, Sqm, Area, PSF, PSM)
   - Verify "RETAIL" badge appears in booking summary

3. **Mix SOHO and Retail Units**:
   - Select both SOHO and Retail units
   - Verify booking form displays appropriate fields for each type

4. **API Validation**:
   - Check browser console for API logs: `[Retail] Fetched X retail products`
   - Verify price mapping is working correctly

## Future Enhancements

1. **Overview Dashboard**: Consider adding retail-specific statistics
2. **Filtering**: Add ability to filter by unit category (SOHO vs. Retail)
3. **Analytics**: Track retail unit performance separately
4. **Export**: Include retail-specific fields in exports

## File Changes Summary

- ✅ `src/lib/fieldMapping.js` - Added retail enums
- ✅ `src/lib/bitrix24.js` - Added retail API methods
- ✅ `src/app/api/units/route.js` - Updated to fetch retail units
- ✅ `src/app/page.js` - Updated grouping and tab display
- ✅ `src/components/RetailUnitCard.jsx` - New component (created)
- ✅ `src/components/UnitGrid.jsx` - Updated to render retail cards
- ✅ `src/components/BookingForm.jsx` - Updated to show retail fields

## Notes

- Retail units use `catalogGroupId: 2` for pricing
- Purple color scheme differentiates retail from SOHO
- No view orientation for retail units (no Southeast/Northwest)
- All retail units are grouped under single "Retail Units" tab
