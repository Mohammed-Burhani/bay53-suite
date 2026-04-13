# Invoice Integration Documentation

## Overview

This document describes the invoice integration implemented for the Bay53 ERP system. The integration provides a unified approach to managing Sales, Purchase, and Stock invoices using the .NET API.

## Architecture

### API Integration Pattern

Following the established pattern from reports (Current Stock, Inventory Report, Ledger Register), the invoice integration uses:

1. **Type Definitions** (`lib/types/invoice.types.ts`)
   - Strongly typed interfaces for API payloads and responses
   - Invoice search parameters
   - Invoice data structures

2. **Service Layer** (`lib/api/invoice.service.ts`)
   - Centralized API calls using the `apiClient`
   - Single endpoint: `/Invoice/Search`
   - Handles session management automatically

3. **React Query Hooks** (`lib/hooks/useInvoices.ts`)
   - `useInvoiceSearch()` - Mutation for on-demand invoice fetching
   - `useInvoices()` - Query for auto-loading with default filters
   - Automatic session ID injection
   - Optimized caching (2-minute stale time)

4. **Reusable Component** (`components/invoices/InvoiceListTable.tsx`)
   - Single component for all invoice types
   - Advanced filtering capabilities
   - Pagination support
   - Real-time search
   - Stats cards
   - AI Assistant integration

## API Endpoint

### Invoice Search API

**Endpoint:** `POST /api/Invoice/Search`

**Payload:**
```typescript
{
  sessionId: string;
  pageSize: number;        // 0 = fetch all
  pageNumber: number;
  invType: number;         // 0 = All, 1 = Sales, 2 = Purchase, etc.
  toDate: string | null;   // "DD/MM/YYYY HH:mm:ss" or null (null when invoiceNo is provided)
  fromDate: string | null; // "DD/MM/YYYY HH:mm:ss" or null (null when invoiceNo is provided)
  invoiceNo: number | null; // Numeric invoice number (when provided, dates are null)
  bill_No: string | null;   // Alphanumeric bill number
  spIds: number[];          // Array of stock place IDs (can be empty for all)
  partyName: string | null; // Party/Ledger name from LedgerSearchInput
  itemName: string | null;  // Item name filter (not currently used in UI)
}
```

**Response:**
```typescript
{
  list: InvoiceSearchItem[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
}
```

**Invoice Item Structure:**
```typescript
{
  invCode: number;
  billNo: string;
  billDate: string;
  partyName: string;
  party_ID: number;
  invType: string;
  invTypeId: number;
  stockPlace: string;
  sp_ID: number;
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  status: string; // "Paid", "Partial", "Unpaid"
  createdBy: string;
  createdDate: string;
  modifiedDate: string;
  note: string | null;
}
```

## Implementation

### Reusable Components Used

The invoice integration leverages existing, battle-tested components:

1. **DateRangeFilter** (`components/reports/DateRangeFilter.tsx`)
   - Provides advanced date filtering options
   - Supports financial year-based filtering
   - Handles date format conversion automatically
   - Used across all report pages

2. **LedgerSearchInput** (`components/reports/LedgerSearchInput.tsx`)
   - Type-ahead search for parties/ledgers
   - Grouped display by ledger groups
   - Supports both single and multi-select modes
   - Used in Ledger Register, Ledger Balances, Ledger Outstanding

### Pages Created/Updated

1. **Purchase Invoices** (`app/(app)/purchases/page.tsx`)
   - Displays all purchase invoices
   - Default filter: `invType = 2` (Purchase)
   - Violet color scheme

2. **Sales Invoices** (`app/(app)/sales/page.tsx`)
   - Displays all sales invoices
   - Default filter: `invType = 1` (Sales)
   - Cyan color scheme

3. **Stock Invoices** (`app/(app)/stock-invoices/page.tsx`)
   - Displays stock transfers and adjustments
   - Default filter: `invType = 0` (All stock types)
   - Emerald color scheme

### Navigation Updates

Updated `components/AppShell.tsx` to include:
- Sales → Sales Invoices (renamed from "All Invoices")
- Purchases → Purchase Invoices (renamed from "All Purchases")
- New "Stock" module with Stock Invoices

## Features

### Filtering Capabilities

The invoice listing supports multiple filters:
- **Invoice Type** - Filter by specific invoice types (dropdown)
- **Invoice Number** - Search by numeric invoice number (disables date filter when entered)
- **Bill Number** - Search by alphanumeric bill number
- **Stock Places** - Multi-select stock places (can select multiple locations)
- **Date Range** - Advanced date filtering with multiple options:
  - Today
  - Current Month
  - Custom Range
  - Monthly (select specific month)
  - Quarterly (select FY and quarter)
  - Half Yearly (select FY and half)
  - Yearly (select FY)
  - None (no date filter)
  - **Note:** Date filter is automatically disabled when invoice number is entered
- **Party (Ledger)** - Search and select party using the LedgerSearchInput component
  - Type-ahead search (minimum 2 characters)
  - Grouped by ledger groups
  - Single selection mode
- **Quick Search** - Real-time text search across all fields

### Filter Behavior

1. **Invoice Number Priority**: When an invoice number is entered, the date filter is automatically disabled and dates are passed as `null` to the API. This allows for direct invoice lookup without date constraints.

2. **Stock Place Multi-Select**: Users can select multiple stock places to filter invoices across different locations. Selected stock places are displayed as badges that can be individually removed.

3. **Smart Date Handling**: The DateRangeFilter component automatically converts dates to the required format ("DD/MM/YYYY HH:mm:ss") for the API.

### Display Features

- **Stats Cards** - Total Amount, Total Paid, Balance Due
- **Pagination** - Configurable page sizes (25, 50, 100, 200)
- **Status Badges** - Visual indicators for Paid/Partial/Unpaid
- **Responsive Design** - Mobile-friendly layout
- **AI Assistant** - Context-aware AI help for each module

### Data Optimization

Following the reports pattern:
- **Aggressive Caching** - Invoice types and stock places cached indefinitely
- **Smart Queries** - Only fetch when filters are applied
- **Stale Time** - 2-minute cache for invoice data
- **Pagination** - Client-side pagination for better UX

## Usage Examples

### Basic Usage

```tsx
import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { ShoppingCart } from "lucide-react";

export default function PurchasesPage() {
  return (
    <InvoiceListTable
      title="Purchase Invoices"
      defaultInvType={2}
      icon={ShoppingCart}
      iconColor="bg-violet-500"
    />
  );
}
```

### Using the Hook Directly

```tsx
import { useInvoiceSearch } from "@/lib/hooks/useInvoices";

function MyComponent() {
  const { mutate: searchInvoices, data, isPending } = useInvoiceSearch();

  const handleSearch = () => {
    searchInvoices({
      pageSize: 0,
      pageNumber: 0,
      invType: 1, // Sales
      fromDate: "01/01/2024 00:00:00",
      toDate: "31/12/2024 23:59:59",
      invoiceNo: null,
      bill_No: null,
      spIds: [],
      partyName: null,
      itemName: null,
    });
  };

  return (
    // Your UI
  );
}
```

### Auto-loading with Query

```tsx
import { useInvoices } from "@/lib/hooks/useInvoices";

function MyComponent() {
  const { data, isLoading } = useInvoices({
    pageSize: 50,
    pageNumber: 1,
    invType: 2, // Purchase
    fromDate: null,
    toDate: null,
    invoiceNo: null,
    bill_No: null,
    spIds: [],
    partyName: null,
    itemName: null,
  });

  return (
    // Your UI
  );
}
```

## Invoice Type IDs

Common invoice type IDs (may vary based on your setup):
- `0` - All types
- `1` - Sales Invoice
- `2` - Purchase Invoice
- `3` - Sales Return
- `4` - Purchase Return
- `5` - Stock Transfer
- `6` - Stock Adjustment

**Note:** Use the `useInvoiceTypes()` hook to fetch the actual invoice types from your system.

## Best Practices

1. **Always use the hooks** - Don't call the service directly
2. **Cache dropdown data** - Invoice types and stock places are cached indefinitely
3. **Use mutations for filters** - Better control over when data is fetched
4. **Implement pagination** - For large datasets
5. **Add loading states** - Better UX during API calls
6. **Handle errors gracefully** - Show toast notifications

## Future Enhancements

Potential improvements:
- Invoice detail view/modal
- Export functionality (CSV, Excel, PDF)
- Bulk operations (delete, update status)
- Advanced analytics and charts
- Print invoice functionality
- Email invoice capability
- Payment recording
- Invoice editing

## Related Files

- `lib/types/invoice.types.ts` - Type definitions
- `lib/api/invoice.service.ts` - API service
- `lib/hooks/useInvoices.ts` - React Query hooks
- `components/invoices/InvoiceListTable.tsx` - Main component
- `components/reports/DateRangeFilter.tsx` - Date filtering component (reused)
- `components/reports/LedgerSearchInput.tsx` - Party search component (reused)
- `app/(app)/purchases/page.tsx` - Purchase invoices page
- `app/(app)/sales/page.tsx` - Sales invoices page
- `app/(app)/stock-invoices/page.tsx` - Stock invoices page
- `components/AppShell.tsx` - Navigation sidebar

## Testing

To test the integration:

1. Navigate to Sales/Purchases/Stock Invoices page
2. Click "Search Invoices" to load data
3. Apply various filters
4. Test pagination
5. Use quick search
6. Verify stats cards update correctly
7. Check AI Assistant functionality

## Troubleshooting

### No invoices showing
- Check if session is valid
- Verify API endpoint is accessible
- Check browser console for errors
- Ensure invoice type IDs are correct

### Filters not working
- Verify date format: "DD/MM/YYYY HH:mm:ss"
- Check if stock place IDs are valid
- Ensure party names match exactly

### Performance issues
- Reduce page size
- Add more specific filters
- Check network tab for slow API calls
- Verify caching is working

## Conclusion

The invoice integration provides a robust, scalable solution for managing all invoice types in the Bay53 ERP system. It follows established patterns, uses modern React practices, and provides an excellent user experience.
