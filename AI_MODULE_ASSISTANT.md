# Module AI Assistant - Implementation Guide

## Overview

The Module AI Assistant is a context-aware chatbot that can be integrated into any module (Inventory, Sales, Purchases, Reports, etc.). It provides two modes:

1. **Chat Mode**: Answers questions about the module's data
2. **Agentic Mode**: Performs actions on behalf of the user

## Features

### Chat Mode Capabilities

The AI assistant can answer questions like:
- "How many products do I have?"
- "What units do I have in Samsung Galaxy?"
- "Show me low stock items"
- "What's the total inventory value?"
- "List all categories"
- "What's the price of Tata Salt?"
- "Show me out of stock products"
- "What are my top products?"

### Agentic Mode Capabilities

The AI assistant can perform actions like:
- "Mark Samsung Galaxy as inactive"
- "Update stock for Tata Salt to 200"
- "Add 50 units to Amul Butter"
- "Change price of Crocin to 30"

## Architecture

### Components

1. **ModuleAIAssistant.tsx** - Main UI component
   - Floating chat button
   - Chat interface with message history
   - Mode toggle (Chat/Agentic)
   - Message input and display

2. **ai-query-processor.ts** - Query processing logic
   - Pattern matching for queries
   - Product/entity extraction
   - Response generation
   - Action identification

### Integration

To integrate the AI assistant into any module:

```tsx
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";

// In your component
<ModuleAIAssistant
  moduleName="Inventory"
  moduleData={{ products }}
  onAgenticAction={handleAgenticAction}
/>
```

### Handler Implementation

```tsx
const handleAgenticAction = async (action: string, params: any) => {
  switch (action) {
    case "mark_inactive":
      updateProduct(params.productId, { isActive: false });
      toast.success(`${params.productName} marked as inactive`);
      break;
    
    case "update_stock":
      updateProduct(params.productId, { stock: params.newStock });
      toast.success(`Stock updated for ${params.productName}`);
      break;
    
    case "add_stock":
      const product = getProductById(params.productId);
      updateProduct(params.productId, { stock: product.stock + params.addQuantity });
      toast.success(`Added ${params.addQuantity} units to ${params.productName}`);
      break;
    
    case "update_price":
      updateProduct(params.productId, { sellingPrice: params.newPrice });
      toast.success(`Price updated for ${params.productName}`);
      break;
  }
  
  // Refresh data
  queryClient.invalidateQueries({ queryKey: ["products"] });
};
```

## Query Processing

### Pattern Matching

The AI uses pattern matching to understand user intent:

```typescript
// Example patterns
matchesPattern(query, ["how many", "total", "count"])
matchesPattern(query, ["low stock", "running low"])
matchesPattern(query, ["price", "cost", "mrp"])
```

### Entity Extraction

The AI can extract:
- Product names from natural language
- Quantities and numbers
- Actions and intents

### Response Generation

Responses are formatted with:
- Clear, structured information
- Emojis for visual appeal
- Bullet points for lists
- Currency formatting for prices

## Extending to Other Modules

### Sales Module

```tsx
<ModuleAIAssistant
  moduleName="Sales"
  moduleData={{ invoices, customers }}
  onAgenticAction={handleSalesAction}
/>
```

Example queries:
- "Show me today's sales"
- "Who are my top customers?"
- "What's the total revenue this month?"
- "Create an invoice for Rajesh Kumar"

### Purchases Module

```tsx
<ModuleAIAssistant
  moduleName="Purchases"
  moduleData={{ purchases, suppliers }}
  onAgenticAction={handlePurchaseAction}
/>
```

Example queries:
- "Show pending purchase orders"
- "Who are my main suppliers?"
- "What's the total purchase value?"
- "Create a purchase order for Metro Wholesale"

### Reports Module

```tsx
<ModuleAIAssistant
  moduleName="Reports"
  moduleData={{ sales, purchases, inventory }}
  onAgenticAction={handleReportAction}
/>
```

Example queries:
- "Generate sales report for last month"
- "Show GST summary"
- "What's my profit margin?"
- "Export inventory report"

## Customization

### Adding New Query Patterns

In `ai-query-processor.ts`:

```typescript
// Add to processChatQuery method
if (this.matchesPattern(lowerQuery, ["your", "pattern"])) {
  // Your logic here
  return {
    response: "Your response",
    data: { /* optional data */ }
  };
}
```

### Adding New Actions

In `processAgenticQuery` method:

```typescript
if (this.matchesPattern(lowerQuery, ["action", "keywords"])) {
  return {
    response: "Action description",
    action: {
      type: "action_type",
      params: { /* action parameters */ }
    }
  };
}
```

## UI Customization

### Styling

The component uses Tailwind CSS and shadcn/ui components. Customize by:

1. Modifying the floating button position
2. Changing chat panel dimensions
3. Adjusting colors and themes
4. Customizing message bubbles

### Positioning

```tsx
// Change position in ModuleAIAssistant.tsx
<Button className="fixed bottom-6 right-6 ...">  // Default
<Button className="fixed bottom-4 left-4 ...">   // Bottom left
<Button className="fixed top-6 right-6 ...">     // Top right
```

## Best Practices

1. **Context Awareness**: Pass relevant data to the assistant
2. **Error Handling**: Implement proper error handling in action handlers
3. **User Feedback**: Use toast notifications for action confirmations
4. **Data Refresh**: Invalidate queries after actions
5. **Security**: Validate actions before execution
6. **Performance**: Limit data passed to the assistant

## Future Enhancements

1. **Natural Language Processing**: Integrate with OpenAI/Anthropic APIs
2. **Voice Input**: Add speech-to-text capability
3. **Multi-language**: Support multiple languages
4. **Learning**: Remember user preferences
5. **Suggestions**: Proactive suggestions based on data
6. **Export**: Export chat history
7. **Shortcuts**: Quick action buttons
8. **Analytics**: Track query patterns

## Example Queries by Module

### Inventory
- ✅ "How many products do I have?"
- ✅ "Show low stock items"
- ✅ "What's the total inventory value?"
- ✅ "What units does Samsung Galaxy use?"
- ✅ "Show me products in Electronics category"
- ✅ "What's the price of Tata Salt?"

### Sales (To be implemented)
- "Show today's sales"
- "Who bought the most this month?"
- "What's my average order value?"
- "Show unpaid invoices"

### Purchases (To be implemented)
- "Show pending orders"
- "What did I buy from Metro Wholesale?"
- "Show this month's purchases"
- "Who are my top suppliers?"

### Reports (To be implemented)
- "Generate sales report"
- "Show GST summary"
- "What's my profit margin?"
- "Compare this month vs last month"

## Testing

Test the assistant with various queries:

```typescript
// Chat mode tests
"how many products"
"low stock items"
"total inventory value"
"price of [product]"
"stock of [product]"
"categories"

// Agentic mode tests
"mark [product] as inactive"
"update stock for [product] to 100"
"add 50 to [product]"
"change price of [product] to 500"
```

## Troubleshooting

### Assistant not responding
- Check if moduleData is passed correctly
- Verify query processor is initialized
- Check console for errors

### Actions not executing
- Ensure onAgenticAction handler is implemented
- Verify action types match in handler
- Check for permission/validation issues

### Poor query understanding
- Add more pattern variations
- Improve entity extraction logic
- Add fuzzy matching for product names

## Support

For issues or questions:
1. Check the implementation in `components/ModuleAIAssistant.tsx`
2. Review query processor in `lib/ai-query-processor.ts`
3. Test with example queries above
4. Check browser console for errors
