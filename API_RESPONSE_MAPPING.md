# API Response Mapping - Current Stock Report

## Actual API Response Structure

Based on the actual API response, here's the correct field mapping:

### Current Stock API Response
```json
{
  "itemcode": "BVF2",
  "itename": "Pressure gauge bottom",
  "category": null,
  "sizes": null,
  "type": null,
  "brand": "Baumer",
  "itemGroup": null,
  "HO": "25",
  "total": 25,
  "stdSellRate": 1363.46,
  "itemid": 88
}
```

## Field Mappings

### Item Search API → Filter Attributes
| Filter Field | Item API Field | Description |
|-------------|----------------|-------------|
| itemCode | `item_CodeTxt` | Item code identifier |
| name | `name` | Item name |
| size | `sizes` | Item size |
| material | `type` | Item type (mapped as material) |
| quality | `category` | Item category (mapped as quality) |
| brand | `brand` | Item brand |

### Current Stock API → Display Fields
| Display Column | API Field | Type | Description |
|---------------|-----------|------|-------------|
| Item Code | `itemcode` | string | Item code |
| Item Name | `itename` | string | Item name |
| Brand | `brand` | string\|null | Brand name |
| Category | `category` | string\|null | Category |
| Size | `sizes` | string\|null | Size |
| Stock (HO) | `HO` | string\|number | Head Office stock |
| Total | `total` | number | Total stock quantity |
| Std Rate | `stdSellRate` | number | Standard selling rate |
| Value | calculated | number | `total * stdSellRate` |
| Status | calculated | badge | Based on `total` value |

## Request Payload

### API Endpoint
`POST /Report/CurrentStock`

### Payload Structure
```typescript
{
  itemCode: string | null,    // null when "All" selected
  name: string | null,         // null when "All" selected
  size: string | null,         // null when "All" selected
  material: string | null,     // null when "All" selected
  quality: string | null,      // null when "All" selected
  brand: string | null,        // null when "All" selected
  spId: number,                // Stock place ID (0 for all)
  sessionId: string            // User session ID
}
```

### Example Request
```json
{
  "itemCode": null,
  "name": null,
  "size": null,
  "material": null,
  "quality": null,
  "brand": "Baumer",
  "spId": 0,
  "sessionId": "abc123"
}
```

## Calculated Fields

### Total Value
```typescript
const itemValue = (item.total || 0) * (item.stdSellRate || 0);
```

### Stock Status
```typescript
const stockStatus = 
  item.total < 0 ? 'negative' :    // Red badge
  item.total < 10 ? 'low' :        // Amber badge
  'good';                          // Green badge
```

### Statistics
```typescript
// Total items count
const totalItems = filteredData.length;

// Total stock across all items
const totalStock = filteredData.reduce((sum, item) => 
  sum + (item.total || 0), 0
);

// Total value across all items
const totalValue = filteredData.reduce((sum, item) => 
  sum + ((item.total || 0) * (item.stdSellRate || 0)), 0
);

// Low stock items (< 10 units)
const lowStockItems = filteredData.filter(item => 
  item.total > 0 && item.total < 10
).length;

// Negative stock items
const negativeStockItems = filteredData.filter(item => 
  item.total < 0
).length;
```

## Search Functionality

The search bar filters across multiple fields:
```typescript
const search = searchTerm.toLowerCase();
return (
  item.itename?.toLowerCase().includes(search) ||
  item.category?.toLowerCase().includes(search) ||
  item.brand?.toLowerCase().includes(search) ||
  item.itemcode?.toLowerCase().includes(search)
);
```

## Grouping by Category

When "Group by Category" is enabled:
```typescript
const groupedData: Record<string, CurrentStockItem[]> = {};
paginatedData.forEach((item) => {
  const category = item.category || "Uncategorized";
  if (!groups[category]) {
    groups[category] = [];
  }
  groups[category].push(item);
});
```

## Type Definitions

### CurrentStockItem
```typescript
interface CurrentStockItem {
  itemcode: string;
  itename: string;
  category: string | null;
  sizes: string | null;
  type: string | null;
  brand: string | null;
  itemGroup: string | null;
  HO: string | number;
  total: number;
  stdSellRate: number;
  itemid: number;
  [key: string]: any;
}
```

### CurrentStockPayload
```typescript
interface CurrentStockPayload {
  itemCode: string | null;
  name: string | null;
  size: string | null;
  material: string | null;
  quality: string | null;
  brand: string | null;
  spId: number;
  sessionId: string;
}
```

## Notes

1. **Null vs Empty String**: When "All" is selected in filters, we send `null` to the API, not empty strings.

2. **HO Field**: The `HO` field can be either string or number in the response, so we handle both types.

3. **Calculated Value**: The "Value" column is calculated on the frontend as `total * stdSellRate`.

4. **Stock Status**: Status badges are determined by the `total` field:
   - Negative (< 0): Red badge with "Negative" text
   - Low (0-9): Amber badge with "Low Stock" text
   - Good (≥ 10): Green badge with "Good" text

5. **Category Grouping**: When grouping is enabled, items are grouped by the `category` field, with null values shown as "Uncategorized".

6. **Search**: The search functionality looks across item name, category, brand, and item code fields.
