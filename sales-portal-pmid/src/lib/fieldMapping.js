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
    },

    // Enums for Dropdown Fields (ID -> Value)
    unitEnums: {
        // Position/View (PROPERTY_102)
        positionView: {
            "168": "Southeast|Retail/SeaView/CityView",//东南|商业步行街/海景/市区景观
            "170": "Northwest|Malacca/SeaView/University Town" //西北|又见马六甲/海景/大学城
        },
        // Level (PROPERTY_104)
        level: {
            "172": "8", "174": "9", "176": "10", "188": "11", "190": "12",
            "192": "13", "194": "14", "196": "15", "198": "16", "200": "17",
            "202": "18", "204": "19", "206": "20", "208": "21", "210": "22",
            "212": "23", "214": "24", "216": "25", "218": "26"
        },
        // Type (PROPERTY_106)
        type: {
            "178": "A", "180": "B1", "182": "B2", "184": "C", "186": "D"
        },
        // Status (PROPERTY_108)
        status: {
            "220": "Booking",
            "222": "Sold",
            "224": "Hold",
            "226": "Available"
        }
    },

    // Pantai Remis-specific Enums
    pantaiRemisEnums: {
        // Type (PROPERTY_106) - Pantai Remis
        type: {
            "278": "Terrace 1",
            "280": "Terrace 2",
            "282": "Terrace 3",
            "284": "Semi-D",
            "286": "Shop Office"
        }
    },

    // Retail-specific Enums
    retailEnums: {
        // Floor (PROPERTY_112) - Retail
        floor: {
            "236": "2",
            "238": "3",
            "240": "4"
        },
        // Sqft (PROPERTY_116) - Retail
        sqft: {
            "242": "4359",
            "246": "6340",
            "244": "7578",
            "248": "2788",
            "250": "2885",
            "252": "4187"
        },
        // Area (PROPERTY_124) - Retail
        area: {
            "254": "78",
            "256": "81",
            "258": "118",
            "260": "123",
            "276": "178",
            "262": "213"
        },
        // Sqm (PROPERTY_126) - Retail
        sqm: {
            "264": "259",
            "266": "268",
            "268": "389",
            "270": "405",
            "272": "589",
            "274": "704"
        }
    }
};
