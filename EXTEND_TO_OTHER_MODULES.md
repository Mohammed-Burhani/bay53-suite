# Extending AI Assistant to Other Modules

## Quick Integration Guide

### 1. Sales Module

**File**: `app/(app)/sales/page.tsx`

```tsx
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";

// In your component
const { data: invoices = [] } = useQuery({
  queryKey: ["invoices"],
  queryFn: () => getInvoices("sale"),
});

const handleSalesAction = async (action: string, params: Record<string, unknown>) => {
  switch (action) {
    case "create_invoice":
      // Create invoice logic
      break;
    case "mark_paid":
      // Mark invoice as paid
      break;
    case "send_reminder":
      // Send payment reminder
      break;
  }
  queryClient.invalidateQueries({ queryKey: ["invoices"] });
};

// Add before closing div
<ModuleAIAssistant
  moduleName="Sales"
  moduleData={{ invoices }}
  onAgenticAction={handleSalesAction}
/>
```

**Example Queries**:
- "Show me today's sales"
- "What's the total revenue this month?"
- "Show unpaid invoices"
- "Who are my top customers?"
- [Agentic] "Mark invoice INV-2025-003 as paid"
- [Agentic] "Send reminder to Ankit Patel"

### 2. Purchases Module

**File**: `app/(app)/purchases/page.tsx`

```tsx
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";

const { data: purchases = [] } = useQuery({
  queryKey: ["purchases"],
  queryFn: () => getInvoices("purchase"),
});

const handlePurchaseAction = async (action: string, params: Record<string, unknown>) => {
  switch (action) {
    case "create_order":
      // Create purchase order
      break;
    case "mark_received":
      // Mark order as received
      break;
    case "update_status":
      // Update order status
      break;
  }
  queryClient.invalidateQueries({ queryKey: ["purchases"] });
};

<ModuleAIAssistant
  moduleName="Purchases"
  moduleData={{ purchases }}
  onAgenticAction={handlePurchaseAction}
/>
```

**Example Queries**:
- "Show pending purchase orders"
- "What did I buy this month?"
- "Who are my main suppliers?"
- "What's the total purchase value?"
- [Agentic] "Create order for Metro Wholesale"
- [Agentic] "Mark PUR-2025-001 as received"

### 3. Parties Module

**File**: `app/(app)/parties/page.tsx`

```tsx
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";

const { data: parties = [] } = useQuery({
  queryKey: ["parties"],
  queryFn: getParties,
});

const handlePartyAction = async (action: string, params: Record<string, unknown>) => {
  switch (action) {
    case "add_customer":
      // Add new customer
      break;
    case "update_balance":
      // Update party balance
      break;
    case "send_statement":
      // Send account statement
      break;
  }
  queryClient.invalidateQueries({ queryKey: ["parties"] });
};

<ModuleAIAssistant
  moduleName="Parties"
  moduleData={{ parties }}
  onAgenticAction={handlePartyAction}
/>
```

**Example Queries**:
- "How many customers do I have?"
- "Show me customers with outstanding balance"
- "Who owes me money?"
- "List all suppliers"
- [Agentic] "Add new customer Amit Sharma"
- [Agentic] "Send statement to Rajesh Kumar"

### 4. Reports Module

**File**: `app/(app)/reports/page.tsx`

```tsx
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";

const { data: reportData } = useQuery({
  queryKey: ["reports"],
  queryFn: getReportData,
});

const handleReportAction = async (action: string, params: Record<string, unknown>) => {
  switch (action) {
    case "generate_report":
      // Generate specific report
      break;
    case "export_data":
      // Export report data
      break;
    case "schedule_report":
      // Schedule recurring report
      break;
  }
};

<ModuleAIAssistant
  moduleName="Reports"
  moduleData={reportData}
  onAgenticAction={handleReportAction}
/>
```

**Example Queries**:
- "Show me sales report for last month"
- "What's my profit margin?"
- "Generate GST summary"
- "Compare this month vs last month"
- [Agentic] "Export sales report as PDF"
- [Agentic] "Schedule monthly inventory report"

## Adding Module-Specific Query Processing

### Step 1: Extend AIQueryProcessor

**File**: `lib/ai-query-processor.ts`

Add new module handling in `processChatQuery`:

```typescript
// Sales Module Queries
if (moduleName === "Sales" && invoices.length > 0) {
  // Today's sales
  if (this.matchesPattern(lowerQuery, ["today", "today's sales"])) {
    const today = new Date().toISOString().split("T")[0];
    const todaySales = invoices.filter(inv => inv.date.startsWith(today));
    const total = todaySales.reduce((sum, inv) => sum + inv.grandTotal, 0);
    
    return {
      response: `Today's Sales:\n\n• Total: ₹${total.toLocaleString("en-IN")}\n• Invoices: ${todaySales.length}\n• Average: ₹${(total / todaySales.length).toLocaleString("en-IN")}`,
      data: { todaySales, total }
    };
  }

  // Unpaid invoices
  if (this.matchesPattern(lowerQuery, ["unpaid", "pending payment", "outstanding"])) {
    const unpaid = invoices.filter(inv => inv.status !== "paid");
    const total = unpaid.reduce((sum, inv) => sum + (inv.grandTotal - inv.amountPaid), 0);
    
    const list = unpaid.map(inv => 
      `• ${inv.invoiceNumber} - ${inv.partyName}: ₹${(inv.grandTotal - inv.amountPaid).toLocaleString("en-IN")}`
    ).join("\n");
    
    return {
      response: `Unpaid Invoices:\n\n${list}\n\nTotal Outstanding: ₹${total.toLocaleString("en-IN")}`,
      data: { unpaid, total }
    };
  }

  // Top customers
  if (this.matchesPattern(lowerQuery, ["top customers", "best customers", "highest"])) {
    const customerSales: Record<string, { name: string; total: number; count: number }> = {};
    
    invoices.forEach(inv => {
      if (!customerSales[inv.partyId]) {
        customerSales[inv.partyId] = { name: inv.partyName, total: 0, count: 0 };
      }
      customerSales[inv.partyId].total += inv.grandTotal;
      customerSales[inv.partyId].count += 1;
    });
    
    const topCustomers = Object.values(customerSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    const list = topCustomers.map((c, i) => 
      `${i + 1}. ${c.name}\n   Total: ₹${c.total.toLocaleString("en-IN")} (${c.count} invoices)`
    ).join("\n\n");
    
    return {
      response: `🏆 Top 5 Customers:\n\n${list}`,
      data: { topCustomers }
    };
  }
}
```

### Step 2: Add Agentic Actions

In `processAgenticQuery`:

```typescript
if (moduleName === "Sales") {
  // Mark as paid
  if (this.matchesPattern(lowerQuery, ["mark", "set"]) && 
      this.matchesPattern(lowerQuery, ["paid", "payment received"])) {
    const invoiceNumber = this.extractInvoiceNumber(originalQuery);
    
    if (invoiceNumber) {
      return {
        response: `I'll mark invoice ${invoiceNumber} as paid.`,
        action: {
          type: "mark_paid",
          params: { invoiceNumber }
        }
      };
    }
  }

  // Create invoice
  if (this.matchesPattern(lowerQuery, ["create", "new"]) && 
      this.matchesPattern(lowerQuery, ["invoice", "bill"])) {
    const customerName = this.extractCustomerName(originalQuery);
    
    if (customerName) {
      return {
        response: `I'll help you create an invoice for ${customerName}.`,
        action: {
          type: "create_invoice",
          params: { customerName }
        }
      };
    }
  }
}
```

### Step 3: Add Helper Methods

```typescript
private extractInvoiceNumber(query: string): string | null {
  const match = query.match(/INV-\d{4}-\d{3}|PUR-\d{4}-\d{3}/i);
  return match ? match[0].toUpperCase() : null;
}

private extractCustomerName(query: string): string | null {
  // Extract customer name from query
  // This is a simple implementation, can be improved
  const words = query.split(" ");
  const forIndex = words.findIndex(w => w.toLowerCase() === "for");
  
  if (forIndex !== -1 && forIndex < words.length - 1) {
    return words.slice(forIndex + 1).join(" ");
  }
  
  return null;
}
```

## Module-Specific Features

### Sales Module Features
- Revenue tracking
- Customer analytics
- Payment status monitoring
- Invoice management
- Sales trends

### Purchases Module Features
- Supplier management
- Order tracking
- Cost analysis
- Inventory replenishment
- Payment scheduling

### Parties Module Features
- Contact management
- Balance tracking
- Transaction history
- Communication logs
- Credit management

### Reports Module Features
- Data visualization
- Export capabilities
- Scheduled reports
- Comparative analysis
- Custom filters

## Best Practices

1. **Module Context**: Pass only relevant data to the assistant
2. **Action Validation**: Validate all actions before execution
3. **Error Handling**: Provide clear error messages
4. **User Feedback**: Use toast notifications
5. **Data Refresh**: Invalidate queries after actions
6. **Security**: Check permissions before actions
7. **Logging**: Log all agentic actions for audit

## Testing Checklist

For each module:
- [ ] Chat mode responds to basic queries
- [ ] Product/entity extraction works
- [ ] Calculations are accurate
- [ ] Agentic mode identifies actions
- [ ] Actions execute correctly
- [ ] Error handling works
- [ ] UI is responsive
- [ ] Data refreshes after actions

## Performance Considerations

1. **Data Filtering**: Filter data before passing to assistant
2. **Lazy Loading**: Load chat history on demand
3. **Debouncing**: Debounce user input
4. **Caching**: Cache query results
5. **Pagination**: Paginate large result sets

## Future Enhancements

1. **Cross-Module Queries**: "Show sales for products in Electronics"
2. **Time-Based Queries**: "Compare last month vs this month"
3. **Predictive Analytics**: "Predict next month's sales"
4. **Recommendations**: "Suggest products to reorder"
5. **Bulk Actions**: "Mark all overdue invoices"
6. **Voice Commands**: Speech-to-text integration
7. **Multi-language**: Support regional languages
8. **Learning**: Remember user preferences

## Support

For implementation help:
1. Check existing Inventory implementation
2. Review query processor patterns
3. Test with example queries
4. Check console for errors
5. Refer to AI_MODULE_ASSISTANT.md
