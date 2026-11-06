# Agent Sales Portal - Development Prompt & Technical Design

## Project Overview
Build a web-based Agent Sales Portal for real estate agents to view available property units and book them through the Bitrix24 CRM system. The portal should display property inventory categorized by view orientation (Southeast/Northwest) and allow agents to select and book units, which will automatically create deals in Bitrix24.

## Bitrix24 Configuration
- **Webhook URL**: `https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/`
- **Product Catalog**: Units stored as products in Bitrix24 CRM
- **Deal Creation**: Bookings create deals in the CRM system

---

## Technical Architecture

### 1. Frontend Components

#### A. Unit Display Grid
- **Layout**: Grid view similar to reference POC image
- **Organization**: Group units by view orientation (Southeast/Northwest)
- **Visual Status**: Color-coded indicators
  - Green: Available
  - Yellow: Reserved
  - Red: Sold
- **Unit Cards**: Display unit number and key information
- **Interactive**: Clickable for selection and detail view

#### B. Unit Selection
- **Multi-select**: Allow agents to select multiple units
- **Selection Indicator**: Visual highlight on selected units
- **Selection Summary**: Show count and list of selected units
- **Quick Actions**: Select All, Clear Selection by view type

#### C. Booking Form
- **Trigger**: Appears when agent clicks "Book" with selected unit(s)
- **Form Fields**: Dynamic fields pulled from Bitrix24 deal structure
- **Validation**: Client-side and server-side validation
- **Submission**: Batch create deals for multiple unit bookings

#### D. Dashboard (Future Enhancement)
- **Statistics**: Total units, available, reserved, sold
- **Filter Options**: By floor, type, size, price range
- **Search**: Quick search by unit number

---

### 2. Backend Architecture Options

**OPTION A: Direct API Calls from React (Simplest - Recommended for MVP)**
- React calls Bitrix24 webhook directly
- No separate backend needed
- Quick to implement
- ⚠️ Webhook URL exposed in frontend (security consideration)

**OPTION B: Serverless Functions (AWS Lambda, Vercel, Netlify)**
- React → Serverless Function → Bitrix24
- Hides webhook URL
- Auto-scaling
- Cost-effective

**OPTION C: Node.js/Express Backend**
- Traditional REST API
- Full control
- Good for complex business logic

**OPTION D: Next.js API Routes (Best Balance)**
- React + API routes in same project
- No separate deployment
- Built-in serverless functions
- Easy to secure

---

### Recommended Approach: Next.js with API Routes

#### A. Project Structure
```
/agent-sales-portal
  /src
    /app
      /api
        /units
          route.js          # GET units list
        /booking
          route.js          # POST create booking
      page.js               # Main React component
    /components
      UnitGrid.jsx
      BookingForm.jsx
      UnitCard.jsx
    /lib
      bitrix24.js           # Bitrix24 API service
      fieldMapping.js       # Field configuration
    /utils
      validators.js
      helpers.js
  .env.local                # Environment variables
  package.json
```

#### B. Configuration Management

**Create field mapping configuration**: `/src/lib/fieldMapping.js`

```javascript
export const BITRIX_CONFIG = {
  // Product (Unit) Field Mapping
  productFields: {
    id: 'ID',
    name: 'NAME',
    status: 'PROPERTY_STATUS',
    viewPosition: 'PROPERTY_VIEW_POSITION',
    level: 'PROPERTY_LEVEL',
    type: 'PROPERTY_TYPE',
    sqft: 'PROPERTY_SQFT',
    price: 'PRICE',
    currency: 'CURRENCY_ID',
    section: 'SECTION_ID',
    catalogId: 'CATALOG_ID',
    active: 'ACTIVE'
  },
  
  // Deal Field Mapping
  dealFields: {
    title: 'TITLE',
    stage: 'STAGE_ID',
    category: 'CATEGORY_ID',
    opportunity: 'OPPORTUNITY',
    currency: 'CURRENCY_ID',
    contact: 'CONTACT_IDS',
    company: 'COMPANY_ID',
    beginDate: 'BEGINDATE',
    closeDate: 'CLOSEDATE',
    comments: 'COMMENTS',
    assignedBy: 'ASSIGNED_BY_ID',
    // Custom fields - update based on your Bitrix24 setup
    unitNumber: 'UF_CRM_UNIT_NUMBER',
    unitType: 'UF_CRM_UNIT_TYPE',
    unitFloor: 'UF_CRM_UNIT_FLOOR',
    unitSqft: 'UF_CRM_UNIT_SQFT',
    unitView: 'UF_CRM_UNIT_VIEW',
    agentName: 'UF_CRM_AGENT_NAME',
    agentEmail: 'UF_CRM_AGENT_EMAIL',
    agentPhone: 'UF_CRM_AGENT_PHONE',
    clientName: 'UF_CRM_CLIENT_NAME',
    clientEmail: 'UF_CRM_CLIENT_EMAIL',
    clientPhone: 'UF_CRM_CLIENT_PHONE'
  },
  
  // Status Mapping
  statusMapping: {
    available: 'Available',
    reserved: 'Reserved',
    sold: 'Sold'
  },
  
  // View Orientation Mapping
  viewMapping: {
    southeast: '东南',
    northwest: '西北'
  },
  
  // Defaults
  defaults: {
    dealStage: 'NEW',
    dealCategory: 0,
    currency: 'MYR'
  }
};
```

#### C. Bitrix24 Service Layer

**Create API service**: `/src/lib/bitrix24.js`

```javascript
import { BITRIX_CONFIG } from './fieldMapping';

const WEBHOOK_URL = process.env.BITRIX24_WEBHOOK_URL;

class Bitrix24Service {
  /**
   * Make API call to Bitrix24
   */
  async callMethod(method, params = {}) {
    const url = `${WEBHOOK_URL}${method}`;
    
    const formData = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Retrieve all products (units) from Bitrix24
   */
  async getUnits(filters = {}) {
    const params = {
      order: { NAME: 'ASC' },
      filter: filters,
      select: [
        'ID',
        'NAME',
        'PRICE',
        'CURRENCY_ID',
        'SECTION_ID',
        'CATALOG_ID',
        'ACTIVE',
        'PROPERTY_*'
      ]
    };
    
    // Handle pagination
    let allUnits = [];
    let start = 0;
    let hasMore = true;
    
    while (hasMore) {
      params.start = start;
      const response = await this.callMethod('crm.product.list', params);
      
      if (response.result && response.result.length > 0) {
        allUnits = [...allUnits, ...response.result];
        start += 50;
        hasMore = response.next !== undefined;
      } else {
        hasMore = false;
      }
    }
    
    return this.transformUnitsData(allUnits);
  }
  
  /**
   * Transform API response to frontend-friendly format
   */
  transformUnitsData(rawUnits) {
    return rawUnits.map(unit => {
      const viewPosition = unit.PROPERTY_VIEW_POSITION?.value || '';
      const viewOrientation = this.determineViewOrientation(viewPosition);
      
      return {
        id: unit.ID,
        name: unit.NAME,
        status: unit.PROPERTY_STATUS?.value || 'Available',
        viewOrientation,
        viewPosition,
        level: unit.PROPERTY_LEVEL?.value || '',
        type: unit.PROPERTY_TYPE?.value || '',
        sqft: unit.PROPERTY_SQFT?.value || '',
        price: unit.PRICE,
        currency: unit.CURRENCY_ID || 'MYR',
        rawData: unit
      };
    });
  }
  
  /**
   * Determine view orientation from position string
   */
  determineViewOrientation(positionString) {
    const { viewMapping } = BITRIX_CONFIG;
    
    if (
      positionString.includes(viewMapping.southeast) ||
      positionString.toLowerCase().includes('southeast') ||
      positionString.includes('东南')
    ) {
      return 'southeast';
    }
    
    if (
      positionString.includes(viewMapping.northwest) ||
      positionString.toLowerCase().includes('northwest') ||
      positionString.includes('西北')
    ) {
      return 'northwest';
    }
    
    return 'other';
  }
  
  /**
   * Create deal in Bitrix24
   */
  async createDeal(bookingData, unitData) {
    const { dealFields, defaults } = BITRIX_CONFIG;
    
    const dealPayload = {
      TITLE: `Booking - ${unitData.name} - ${bookingData.clientName}`,
      STAGE_ID: defaults.dealStage,
      CATEGORY_ID: defaults.dealCategory,
      OPPORTUNITY: unitData.price,
      CURRENCY_ID: unitData.currency,
      BEGINDATE: new Date().toISOString(),
      CLOSEDATE: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      OPENED: 'Y',
      COMMENTS: 'Unit Booking via Agent Portal',
      
      // Map custom fields
      [dealFields.unitNumber]: unitData.name,
      [dealFields.unitType]: unitData.type,
      [dealFields.unitFloor]: unitData.level,
      [dealFields.unitSqft]: unitData.sqft,
      [dealFields.unitView]: unitData.viewPosition,
      [dealFields.agentName]: bookingData.agentName,
      [dealFields.agentEmail]: bookingData.agentEmail,
      [dealFields.agentPhone]: bookingData.agentPhone,
      [dealFields.clientName]: bookingData.clientName,
      [dealFields.clientEmail]: bookingData.clientEmail,
      [dealFields.clientPhone]: bookingData.clientPhone
    };
    
    // Add contact/company if provided
    if (bookingData.contactId) {
      dealPayload.CONTACT_IDS = [bookingData.contactId];
    }
    
    if (bookingData.companyId) {
      dealPayload.COMPANY_ID = bookingData.companyId;
    }
    
    const params = {
      fields: dealPayload,
      params: {
        REGISTER_SONET_EVENT: 'Y'
      }
    };
    
    return this.callMethod('crm.deal.add', params);
  }
  
  /**
   * Batch create deals for multiple units
   */
  async createMultipleDeals(bookingData, units) {
    const results = [];
    
    for (const unit of units) {
      try {
        const result = await this.createDeal(bookingData, unit);
        results.push({
          unitId: unit.id,
          unitName: unit.name,
          success: !!result.result,
          dealId: result.result,
          error: result.error_description || null
        });
      } catch (error) {
        results.push({
          unitId: unit.id,
          unitName: unit.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Get deal form fields structure
   */
  async getDealFields() {
    return this.callMethod('crm.deal.fields');
  }
}

export const bitrix24 = new Bitrix24Service();

---

### 6. React Components

#### UnitGrid Component: `/src/components/UnitGrid.jsx`

```javascript
export default function UnitGrid({ units, selectedUnits, onUnitClick }) {
  const isSelected = (unit) => {
    return selectedUnits.some(u => u.id === unit.id);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600';
      case 'reserved':
        return 'bg-yellow-500 cursor-not-allowed';
      case 'sold':
        return 'bg-red-500 cursor-not-allowed';
      default:
        return 'bg-gray-500';
    }
  };

  // Group by floor
  const groupedByFloor = units.reduce((acc, unit) => {
    const floor = unit.level || 'Unknown';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(unit);
    return acc;
  }, {});

  const sortedFloors = Object.keys(groupedByFloor).sort((a, b) => b - a);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {sortedFloors.map(floor => (
        <div key={floor} className="mb-8 last:mb-0">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Floor {floor}
          </h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {groupedByFloor[floor].map(unit => (
              <button
                key={unit.id}
                onClick={() => onUnitClick(unit)}
                disabled={unit.status !== 'Available'}
                className={`
                  relative p-3 rounded-lg text-white font-medium
                  transition-all duration-200
                  ${getStatusColor(unit.status)}
                  ${isSelected(unit) ? 'ring-4 ring-blue-400 scale-105' : ''}
                  ${unit.status === 'Available' ? 'cursor-pointer' : ''}
                `}
              >
                <div className="text-sm">{unit.name}</div>
                {unit.price && (
                  <div className="text-xs mt-1 opacity-90">
                    RM {Number(unit.price).toLocaleString()}
                  </div>
                )}
                {isSelected(unit) && (
                  <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full w-5 h-5 flex items-center justify-center">
                    <span className="text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Sold</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### BookingForm Component: `/src/components/BookingForm.jsx`

```javascript
import { useState } from 'react';

export default function BookingForm({ selectedUnits, onSubmit, onClose, loading }) {
  const [formData, setFormData] = useState({
    agentName: '',
    agentEmail: '',
    agentPhone: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    remarks: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.agentName.trim()) {
      newErrors.agentName = 'Agent name is required';
    }
    
    if (!formData.agentEmail.trim()) {
      newErrors.agentEmail = 'Agent email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.agentEmail)) {
      newErrors.agentEmail = 'Email is invalid';
    }
    
    if (!formData.agentPhone.trim()) {
      newErrors.agentPhone = 'Agent phone is required';
    }
    
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    
    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Client email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Email is invalid';
    }
    
    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'Client phone is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const totalPrice = selectedUnits.reduce((sum, unit) => 
    sum + (parseFloat(unit.price) || 0), 0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Book Selected Units
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Selected Units Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Selected Units</h3>
            <div className="space-y-1">
              {selectedUnits.map(unit => (
                <div key={unit.id} className="flex justify-between text-sm">
                  <span>{unit.name} - Floor {unit.level}</span>
                  <span className="font-medium">
                    RM {Number(unit.price).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>RM {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Agent Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agent Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="agentName"
                  value={formData.agentName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.agentName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.agentName && (
                  <p className="mt-1 text-sm text-red-600">{errors.agentName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="agentEmail"
                  value={formData.agentEmail}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.agentEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.agentEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.agentEmail}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="agentPhone"
                  value={formData.agentPhone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.agentPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.agentPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.agentPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Client Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.clientName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.clientName && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.clientEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.clientEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientEmail}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.clientPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.clientPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks (Optional)
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### UnitCard Component (Optional Detail View): `/src/components/UnitCard.jsx`

```javascript
export default function UnitCard({ unit }) {
  const getStatusBadge = (status) => {
    const colors = {
      Available: 'bg-green-100 text-green-800',
      Reserved: 'bg-yellow-100 text-yellow-800',
      Sold: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-gray-900">{unit.name}</h3>
        <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(unit.status)}`}>
          {unit.status}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Floor:</span>
          <span className="font-medium">{unit.level}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Type:</span>
          <span className="font-medium">{unit.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Size:</span>
          <span className="font-medium">{unit.sqft} sqft</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">View:</span>
          <span className="font-medium capitalize">{unit.viewOrientation}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="text-gray-600">Price:</span>
          <span className="font-bold text-lg">
            {unit.currency} {Number(unit.price).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
```

```sql
CREATE TABLE `unit_cache` (
    `id` INT PRIMARY KEY,
    `bitrix_id` INT NOT NULL,
    `name` VARCHAR(100),
    `status` ENUM('available', 'reserved', 'sold'),
    `view_orientation` VARCHAR(50),
    `level` INT,
    `type` VARCHAR(50),
    `sqft` DECIMAL(10,2),
    `price` DECIMAL(15,2),
    `currency` VARCHAR(10),
    `last_sync` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_status` (`status`),
    INDEX `idx_view` (`view_orientation`)
) ENGINE=InnoDB;

CREATE TABLE `booking_log` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `unit_id` INT,
    `deal_id` INT,
    `agent_name` VARCHAR(255),
    `client_name` VARCHAR(255),
    `booking_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('pending', 'success', 'failed'),
    `error_message` TEXT,
    INDEX `idx_deal` (`deal_id`),
    INDEX `idx_date` (`booking_date`)
) ENGINE=InnoDB;
```

---

### 4. Frontend Structure (React/Next.js)

#### Main Page Component: `/src/app/page.js`

```javascript
'use client';

import { useState, useEffect } from 'react';
import UnitGrid from '@/components/UnitGrid';
import BookingForm from '@/components/BookingForm';
import { toast } from 'react-hot-toast';

export default function Home() {
  const [units, setUnits] = useState({ southeast: [], northwest: [] });
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [activeTab, setActiveTab] = useState('southeast');

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/units');
      const data = await response.json();
      
      if (data.success) {
        const grouped = groupUnitsByView(data.units);
        setUnits(grouped);
      } else {
        toast.error('Failed to load units');
      }
    } catch (error) {
      toast.error('Error loading units: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const groupUnitsByView = (unitsList) => {
    return {
      southeast: unitsList.filter(u => u.viewOrientation === 'southeast'),
      northwest: unitsList.filter(u => u.viewOrientation === 'northwest')
    };
  };

  const toggleUnitSelection = (unit) => {
    if (unit.status !== 'Available') return;

    setSelectedUnits(prev => {
      const exists = prev.find(u => u.id === unit.id);
      if (exists) {
        return prev.filter(u => u.id !== unit.id);
      } else {
        return [...prev, unit];
      }
    });
  };

  const handleBooking = () => {
    if (selectedUnits.length === 0) {
      toast.error('Please select at least one unit');
      return;
    }
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingData,
          unitIds: selectedUnits.map(u => u.id)
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully booked ${result.summary.successful} unit(s)`);
        setSelectedUnits([]);
        setShowBookingForm(false);
        loadUnits(); // Refresh
      } else {
        toast.error(result.error || 'Booking failed');
      }
    } catch (error) {
      toast.error('Error creating booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedUnits([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Agent Sales Portal
          </h1>
          <p className="text-gray-600">
            Select units to book for your clients
          </p>
        </div>

        {/* Selection Summary */}
        {selectedUnits.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">
                  {selectedUnits.length} unit(s) selected
                </p>
                <p className="text-sm text-blue-700">
                  {selectedUnits.map(u => u.name).join(', ')}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100"
                >
                  Clear
                </button>
                <button
                  onClick={handleBooking}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('southeast')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'southeast'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Southeast View ({units.southeast.length})
              </button>
              <button
                onClick={() => setActiveTab('northwest')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'northwest'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Northwest View ({units.northwest.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Unit Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading units...</p>
          </div>
        ) : (
          <UnitGrid
            units={units[activeTab]}
            selectedUnits={selectedUnits}
            onUnitClick={toggleUnitSelection}
          />
        )}

        {/* Booking Form Modal */}
        {showBookingForm && (
          <BookingForm
            selectedUnits={selectedUnits}
            onSubmit={handleBookingSubmit}
            onClose={() => setShowBookingForm(false)}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
```

---

### 5. Next.js API Routes Implementation

#### `/src/app/api/units/route.js`
```javascript
import { NextResponse } from 'next/server';
import { bitrix24 } from '@/lib/bitrix24';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Optional filters
    const filters = {};
    if (status) {
      filters.PROPERTY_STATUS = status;
    }
    
    const units = await bitrix24.getUnits(filters);
    
    return NextResponse.json({
      success: true,
      units,
      count: units.length
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
```

#### `/src/app/api/booking/route.js`
```javascript
import { NextResponse } from 'next/server';
import { bitrix24 } from '@/lib/bitrix24';

export async function POST(request) {
  try {
    const body = await request.json();
    const { bookingData, unitIds } = body;
    
    if (!bookingData || !unitIds || unitIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data'
        },
        { status: 400 }
      );
    }
    
    // Get all units
    const allUnits = await bitrix24.getUnits();
    
    // Filter selected units
    const selectedUnits = allUnits.filter(unit => 
      unitIds.includes(unit.id)
    );
    
    // Verify all units are available
    const unavailableUnits = selectedUnits.filter(
      unit => unit.status !== 'Available'
    );
    
    if (unavailableUnits.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Some units are no longer available',
          unavailableUnits: unavailableUnits.map(u => u.name)
        },
        { status: 400 }
      );
    }
    
    // Create deals
    const results = await bitrix24.createMultipleDeals(
      bookingData,
      selectedUnits
    );
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    return NextResponse.json({
      success: failedCount === 0,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failedCount
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
```

#### `/src/app/api/deal-fields/route.js`
```javascript
import { NextResponse } from 'next/server';
import { bitrix24 } from '@/lib/bitrix24';

// Utility endpoint to check Bitrix24 field structure
export async function GET() {
  try {
    const fields = await bitrix24.getDealFields();
    
    return NextResponse.json({
      success: true,
      fields
    });
  } catch (error) {
    console.error('Error fetching deal fields:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

---

### 7. Environment Setup & Installation

#### `.env.local`
```bash
# Bitrix24 Webhook URL - KEEP SECRET!
BITRIX24_WEBHOOK_URL=https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/

# Optional configurations
NEXT_PUBLIC_APP_NAME=Agent Sales Portal
NEXT_PUBLIC_COMPANY_NAME=Your Company Name
```

#### Installation Steps
```bash
# 1. Create Next.js project
npx create-next-app@latest agent-sales-portal --use-npm

# Select options:
# - TypeScript? No
# - ESLint? Yes
# - Tailwind CSS? Yes  
# - src/ directory? Yes
# - App Router? Yes

# 2. Navigate to project
cd agent-sales-portal

# 3. Install dependencies
npm install react-hot-toast

# 4. Create .env.local
echo "BITRIX24_WEBHOOK_URL=https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/" > .env.local

# 5. Create directories
mkdir -p src/lib src/components

# 6. Run development server
npm run dev
```

---

## Implementation Checklist

### Phase 1: Setup & Configuration
- [ ] Create Next.js project
- [ ] Set up environment variables (.env.local)
- [ ] Create field mapping configuration (fieldMapping.js)
- [ ] Verify Bitrix24 webhook access

### Phase 2: Backend Development
- [ ] Create Bitrix24 service layer (bitrix24.js)
- [ ] Implement API route: GET /api/units
- [ ] Implement API route: POST /api/booking
- [ ] Test API endpoints with Postman/Thunder Client

### Phase 3: Frontend Development
- [ ] Create UnitGrid component
- [ ] Create BookingForm component
- [ ] Create main page with tabs
- [ ] Implement unit selection logic
- [ ] Add loading states and error handling

### Phase 4: Testing & Verification
- [ ] Test unit loading from Bitrix24
- [ ] Verify field mapping is correct
- [ ] Test booking creation
- [ ] Verify deals appear in Bitrix24 CRM
- [ ] Test with multiple unit selection

### Phase 5: Enhancements (Optional)
- [ ] Add unit search/filter functionality
- [ ] Implement caching for better performance
- [ ] Add agent authentication
- [ ] Create admin dashboard
- [ ] Add booking history view

---

## Bitrix24 API Sample Usage

### Retrieve Products (Units)
```javascript
// GET request to Bitrix24
const response = await fetch('https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/crm.product.list', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    order: JSON.stringify({ NAME: 'ASC' }),
    filter: JSON.stringify({}),
    select: JSON.stringify(['ID', 'NAME', 'PRICE', 'CURRENCY_ID', 'PROPERTY_*'])
  })
});

const data = await response.json();
console.log(data.result); // Array of products
```

### Create Deal
```javascript
const dealData = {
  fields: JSON.stringify({
    TITLE: 'Booking - Unit 08-01 - John Doe',
    STAGE_ID: 'NEW',
    OPPORTUNITY: 720000,
    CURRENCY_ID: 'MYR',
    UF_CRM_UNIT_NUMBER: 'Unit 08-01',
    UF_CRM_CLIENT_NAME: 'John Doe',
    UF_CRM_CLIENT_EMAIL: 'john@example.com'
  })
};

const response = await fetch('https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/crm.deal.add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams(dealData)
});

const result = await response.json();
console.log('Deal ID:', result.result);
```

---

## Next Steps Before Implementation

1. **Verify Custom Fields**: Call the `/api/deal-fields` endpoint to get the actual field codes in your Bitrix24
   ```bash
   curl http://localhost:3000/api/deal-fields
   ```

2. **Update Field Mapping**: Edit `src/lib/fieldMapping.js` with correct symbolic codes for custom fields

3. **Test Product Retrieval**: Verify you can fetch products from Bitrix24
   ```bash
   curl https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/crm.product.list
   ```

4. **Check Product Properties**: Verify the PROPERTY_* fields match your expectations

5. **Create Test Custom Fields** (if they don't exist):
   - Go to Bitrix24 → CRM → Settings → Custom Fields
   - Create fields for: Unit Number, Unit Type, Unit Floor, Unit Sqft, Unit View
   - Create fields for: Agent Name, Agent Email, Agent Phone
   - Create fields for: Client Name, Client Email, Client Phone

---

## Deployment Options

### Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Set environment variables in Vercel dashboard
# BITRIX24_WEBHOOK_URL=your_webhook_url
```

### Alternative: Netlify, AWS Amplify, Railway
All support Next.js out of the box with similar deployment processes.

---

## Support & Troubleshooting

### Common Issues

**Issue**: Units not loading
- **Solution**: Check webhook URL is correct and accessible
- **Solution**: Verify CORS isn't blocking requests (shouldn't be issue with Next.js API routes)

**Issue**: Deal creation fails
- **Solution**: Verify custom field codes in fieldMapping.js
- **Solution**: Check required fields in Bitrix24 deal entity

**Issue**: Products have no properties
- **Solution**: Ensure products in Bitrix24 have properties filled
- **Solution**: Use PROPERTY_* to fetch all properties

**Issue**: View orientation not categorizing correctly  
- **Solution**: Update viewMapping in fieldMapping.js to match your actual data
- **Solution**: Check PROPERTY_VIEW_POSITION field content

---

## Claude Prompt Summary

You can use this prompt when working with Claude to implement this system:

```
I need to build an Agent Sales Portal for property unit bookings with these requirements:

TECH STACK:
- Frontend: Next.js 14 + React + Tailwind CSS
- Backend: Next.js API Routes (serverless)
- Integration: Bitrix24 CRM via webhook
- Webhook: https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/

FEATURES:
- Display property units in grid (grouped by Southeast/Northwest view)
- Color-coded status (Available/Reserved/Sold)
- Multi-select units for booking
- Booking form captures agent & client details
- Creates deals in Bitrix24 CRM

UNIT FIELDS (from Bitrix24 Products):
- Name, Status, View Position, Level (floor), Type, Sqft, Price

IMPLEMENTATION APPROACH:
- Use crm.product.list to fetch units
- Use crm.deal.add to create bookings
- Field mapping configuration for flexibility
- Handle pagination for large datasets

Please help me implement [specific component/feature].
```

---

End of Technical Design Document

