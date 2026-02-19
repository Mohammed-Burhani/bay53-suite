# AI Assistant Demo Queries

## How to Test

1. Navigate to the Inventory page
2. Click the floating chat button in the bottom-right corner
3. Try the queries below

## Chat Mode Queries

### General Information
```
How many products do I have?
```
Expected: "You have 10 products in your inventory."

```
What categories do I have?
```
Expected: List of all product categories with counts

```
What's my total inventory value?
```
Expected: Total value calculation with breakdown

### Product-Specific Queries

```
What units do I have in Samsung Galaxy?
```
Expected: Unit information for Samsung Galaxy M14 5G

```
What's the stock of Tata Salt?
```
Expected: Current stock level and status

```
What's the price of Amul Butter?
```
Expected: Cost price, selling price, MRP, and margin

```
How much stock does Crocin have?
```
Expected: Stock information with threshold

### Stock Status Queries

```
Show me low stock items
```
Expected: List of products below threshold

```
What products are out of stock?
```
Expected: List of products with 0 stock

```
Show me my top products
```
Expected: Top 5 products by stock value

## Agentic Mode Queries

### Switch to Agentic Mode First!
Click the "Agentic" button in the chat interface

### Stock Management

```
Update stock for Tata Salt to 200
```
Expected: Confirmation message about stock update

```
Add 50 units to Amul Butter
```
Expected: Confirmation with new stock level

### Product Status

```
Mark Havells Fan Regulator as inactive
```
Expected: Confirmation about marking product inactive

### Price Updates

```
Change price of Crocin to 30
```
Expected: Confirmation about price update

## Advanced Queries (Try These!)

### Chat Mode
```
Which products need reordering?
```

```
Show me all electronics
```

```
What's the value of my grocery products?
```

```
How many products are in stock?
```

### Agentic Mode
```
Set stock for Samsung Galaxy to 50
```

```
Increase stock of Classmate Notebook by 100
```

```
Update selling price of Bosch Drill to 3600
```

## Tips for Better Results

1. **Be Specific**: Mention product names clearly
2. **Use Keywords**: Include words like "stock", "price", "units", "value"
3. **Natural Language**: Ask questions naturally
4. **Product Names**: Use partial names (e.g., "Samsung" instead of full name)
5. **Numbers**: Include quantities when updating stock

## Common Patterns

### Questions About Quantity
- "How many..."
- "What's the stock..."
- "Show me..."
- "List..."

### Questions About Price
- "What's the price..."
- "How much does..."
- "Cost of..."

### Questions About Status
- "Low stock..."
- "Out of stock..."
- "Available..."

### Actions (Agentic Mode)
- "Update..."
- "Change..."
- "Set..."
- "Mark as..."
- "Add..."
- "Increase..."

## Expected Behavior

### Chat Mode
- ✅ Answers questions about data
- ✅ Provides formatted responses
- ✅ Shows relevant statistics
- ❌ Does NOT modify data

### Agentic Mode
- ✅ Understands action requests
- ✅ Identifies products and parameters
- ✅ Generates action plans
- ⚠️ Actions are logged but not executed (prototype)

## Troubleshooting

### "Could you specify which product?"
- The AI couldn't identify the product
- Try using more specific product names
- Use SKU or exact product name

### "I understand you're asking about..."
- The query pattern wasn't recognized
- Try rephrasing with different keywords
- Use simpler, more direct questions

### No Response
- Check browser console for errors
- Ensure you're on the Inventory page
- Refresh the page and try again

## Next Steps

To make actions actually work:
1. Implement the `handleAgenticAction` function fully
2. Connect to your backend/database
3. Add proper validation and error handling
4. Add confirmation dialogs for destructive actions
5. Implement undo functionality

## Example Conversation

```
User: How many products do I have?
AI: You have 10 products in your inventory.

User: Show me low stock items
AI: You have 3 products with low stock:
• Crocin Advance - 20 Tablets: 3 Pack (threshold: 15)
• Havells Fan Regulator: 2 Pcs (threshold: 5)
• ...

User: [Switch to Agentic Mode]

User: Update stock for Crocin to 20
AI: I'll update the stock for "Crocin Advance - 20 Tablets" to 20 Pack.
[Action would be executed here]
```

## Integration with Other Modules

The same component can be used in:
- Sales module (queries about invoices, customers)
- Purchases module (queries about orders, suppliers)
- Reports module (generate and analyze reports)
- Parties module (customer/supplier information)

Just pass the appropriate `moduleName` and `moduleData`!
