import { Product, Party, Invoice } from "./types";

export interface QueryContext {
  moduleName: string;
  products?: Product[];
  parties?: Party[];
  invoices?: Invoice[];
}

export interface QueryResult {
  response: string;
  data?: Record<string, unknown>;
  action?: {
    type: string;
    params: Record<string, unknown>;
  };
}

export class AIQueryProcessor {
  private context: QueryContext;

  constructor(context: QueryContext) {
    this.context = context;
  }

  async processQuery(query: string, mode: "chat" | "agentic"): Promise<QueryResult> {
    const lowerQuery = query.toLowerCase();

    if (mode === "chat") {
      return this.processChatQuery(lowerQuery, query);
    } else {
      return this.processAgenticQuery(lowerQuery, query);
    }
  }

  private processChatQuery(lowerQuery: string, originalQuery: string): QueryResult {
    const { moduleName, products = [] } = this.context;

    // Inventory Module Queries
    if (moduleName === "Inventory" && products.length > 0) {
      // Count queries
      if (this.matchesPattern(lowerQuery, ["how many", "total", "count"]) && 
          this.matchesPattern(lowerQuery, ["product"])) {
        return {
          response: `You have ${products.length} products in your inventory.`,
          data: { count: products.length }
        };
      }

      // Low stock queries
      if (this.matchesPattern(lowerQuery, ["low stock", "running low", "need reorder"])) {
        const lowStock = products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0);
        if (lowStock.length === 0) {
          return { response: "Great news! No products are currently low on stock." };
        }
        const list = lowStock.map(p => `• ${p.name}: ${p.stock} ${p.unit} (threshold: ${p.lowStockThreshold})`).join("\n");
        return {
          response: `You have ${lowStock.length} products with low stock:\n\n${list}`,
          data: { lowStock }
        };
      }

      // Out of stock queries
      if (this.matchesPattern(lowerQuery, ["out of stock", "no stock", "unavailable"])) {
        const outOfStock = products.filter(p => p.stock === 0);
        if (outOfStock.length === 0) {
          return { response: "All products are in stock!" };
        }
        const list = outOfStock.map(p => `• ${p.name} (${p.category})`).join("\n");
        return {
          response: `${outOfStock.length} products are out of stock:\n\n${list}`,
          data: { outOfStock }
        };
      }

      // Unit queries
      if (this.matchesPattern(lowerQuery, ["unit", "measure"]) && 
          this.matchesPattern(lowerQuery, ["product", "item"])) {
        const product = this.findProduct(originalQuery, products);
        if (product) {
          return {
            response: `${product.name} is measured in ${product.unit}.\n\nCurrent stock: ${product.stock} ${product.unit}\nLow stock threshold: ${product.lowStockThreshold} ${product.unit}`,
            data: { product }
          };
        }
        return { response: "Could you specify which product you're asking about?" };
      }

      // Stock queries
      if (this.matchesPattern(lowerQuery, ["stock", "quantity", "available", "have"])) {
        const product = this.findProduct(originalQuery, products);
        if (product) {
          const status = product.stock === 0 ? "OUT OF STOCK" : 
                        product.stock <= product.lowStockThreshold ? "LOW STOCK" : "IN STOCK";
          return {
            response: `${product.name}\n\nStock: ${product.stock} ${product.unit}\nStatus: ${status}\nLow stock threshold: ${product.lowStockThreshold} ${product.unit}\n\nValue: ₹${(product.stock * product.sellingPrice).toLocaleString("en-IN")}`,
            data: { product }
          };
        }
      }

      // Price queries
      if (this.matchesPattern(lowerQuery, ["price", "cost", "mrp", "selling"])) {
        const product = this.findProduct(originalQuery, products);
        if (product) {
          const margin = ((product.sellingPrice - product.costPrice) / product.sellingPrice * 100).toFixed(1);
          return {
            response: `${product.name}\n\n💰 Pricing:\n• Cost Price: ₹${product.costPrice.toLocaleString("en-IN")}\n• Selling Price: ₹${product.sellingPrice.toLocaleString("en-IN")}\n• MRP: ₹${product.mrp.toLocaleString("en-IN")}\n• Profit Margin: ${margin}%\n• GST Rate: ${product.gstRate}%`,
            data: { product }
          };
        }
      }

      // Category queries
      if (this.matchesPattern(lowerQuery, ["category", "categories", "types"])) {
        const categories = [...new Set(products.map(p => p.category))];
        const categoryStats = categories.map(cat => {
          const catProducts = products.filter(p => p.category === cat);
          const totalValue = catProducts.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
          return { category: cat, count: catProducts.length, value: totalValue };
        }).sort((a, b) => b.count - a.count);

        const list = categoryStats.map(c => 
          `• ${c.category}: ${c.count} products (₹${c.value.toLocaleString("en-IN")})`
        ).join("\n");

        return {
          response: `You have products in ${categories.length} categories:\n\n${list}`,
          data: { categoryStats }
        };
      }

      // Value queries
      if (this.matchesPattern(lowerQuery, ["total value", "inventory value", "worth"])) {
        const totalValue = products.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
        const totalCost = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
        const potentialProfit = totalValue - totalCost;

        return {
          response: `📊 Inventory Value:\n\n• Total Selling Value: ₹${totalValue.toLocaleString("en-IN")}\n• Total Cost Value: ₹${totalCost.toLocaleString("en-IN")}\n• Potential Profit: ₹${potentialProfit.toLocaleString("en-IN")}\n\nBased on ${products.length} products`,
          data: { totalValue, totalCost, potentialProfit }
        };
      }

      // Top products
      if (this.matchesPattern(lowerQuery, ["top", "best", "highest", "most valuable"])) {
        const topByValue = [...products]
          .sort((a, b) => (b.stock * b.sellingPrice) - (a.stock * a.sellingPrice))
          .slice(0, 5);
        
        const list = topByValue.map((p, i) => 
          `${i + 1}. ${p.name}\n   Stock: ${p.stock} ${p.unit} | Value: ₹${(p.stock * p.sellingPrice).toLocaleString("en-IN")}`
        ).join("\n\n");

        return {
          response: `🏆 Top 5 Products by Stock Value:\n\n${list}`,
          data: { topProducts: topByValue }
        };
      }
    }

    // Generic response
    return {
      response: `I understand you're asking about "${originalQuery}". I'm analyzing your ${moduleName} data. Could you rephrase or be more specific?`
    };
  }

  private processAgenticQuery(lowerQuery: string, originalQuery: string): QueryResult {
    const { moduleName, products = [] } = this.context;

    if (moduleName === "Inventory") {
      // Mark as inactive
      if (this.matchesPattern(lowerQuery, ["mark", "set", "make"]) && 
          this.matchesPattern(lowerQuery, ["inactive", "disable"])) {
        const product = this.findProduct(originalQuery, products);
        if (product) {
          return {
            response: `I'll mark "${product.name}" as inactive. This will hide it from active listings but preserve the data.`,
            action: {
              type: "mark_inactive",
              params: { productId: product.id, productName: product.name }
            }
          };
        }
        return { response: "Which product would you like to mark as inactive?" };
      }

      // Update stock
      if (this.matchesPattern(lowerQuery, ["update", "change", "set", "adjust"]) && 
          this.matchesPattern(lowerQuery, ["stock", "quantity"])) {
        const product = this.findProduct(originalQuery, products);
        const quantity = this.extractNumber(originalQuery);
        
        if (product && quantity !== null) {
          return {
            response: `I'll update the stock for "${product.name}" to ${quantity} ${product.unit}.`,
            action: {
              type: "update_stock",
              params: { productId: product.id, productName: product.name, newStock: quantity }
            }
          };
        }
        return { response: "Please specify the product and the new stock quantity." };
      }

      // Add stock
      if (this.matchesPattern(lowerQuery, ["add", "increase"]) && 
          this.matchesPattern(lowerQuery, ["stock", "quantity"])) {
        const product = this.findProduct(originalQuery, products);
        const quantity = this.extractNumber(originalQuery);
        
        if (product && quantity !== null) {
          const newStock = product.stock + quantity;
          return {
            response: `I'll add ${quantity} ${product.unit} to "${product.name}". New stock will be ${newStock} ${product.unit}.`,
            action: {
              type: "add_stock",
              params: { productId: product.id, productName: product.name, addQuantity: quantity, newStock }
            }
          };
        }
        return { response: "Please specify the product and quantity to add." };
      }

      // Update price
      if (this.matchesPattern(lowerQuery, ["update", "change", "set"]) && 
          this.matchesPattern(lowerQuery, ["price", "selling price"])) {
        const product = this.findProduct(originalQuery, products);
        const price = this.extractNumber(originalQuery);
        
        if (product && price !== null) {
          return {
            response: `I'll update the selling price for "${product.name}" to ₹${price}.`,
            action: {
              type: "update_price",
              params: { productId: product.id, productName: product.name, newPrice: price }
            }
          };
        }
        return { response: "Please specify the product and the new price." };
      }
    }

    return {
      response: `In agentic mode, I can perform actions like:\n\n• Update product status (mark as inactive)\n• Modify stock levels (add/update stock)\n• Change prices\n• Add/edit entries\n\nTry: "Mark [product] as inactive" or "Update stock for [product] to 50"`
    };
  }

  private matchesPattern(query: string, patterns: string[]): boolean {
    return patterns.some(pattern => query.includes(pattern));
  }

  private findProduct(query: string, products: Product[]): Product | null {
    const lowerQuery = query.toLowerCase();
    
    // Try exact name match first
    for (const product of products) {
      if (lowerQuery.includes(product.name.toLowerCase())) {
        return product;
      }
    }

    // Try SKU match
    for (const product of products) {
      if (lowerQuery.includes(product.sku.toLowerCase())) {
        return product;
      }
    }

    // Try word matching
    for (const product of products) {
      const words = product.name.toLowerCase().split(" ");
      for (const word of words) {
        if (word.length > 3 && lowerQuery.includes(word)) {
          return product;
        }
      }
    }

    return null;
  }

  private extractNumber(query: string): number | null {
    const matches = query.match(/\d+/);
    return matches ? parseInt(matches[0], 10) : null;
  }
}
