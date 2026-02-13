"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Sparkles,
  Loader2,
  User,
  Bot,
  Trash2,
  Download,
  Copy,
  Check,
  Settings,
  MessageSquare,
  BarChart3,
  Package,
  TrendingUp,
  AlertTriangle,
  Mic,
  Paperclip,
  Zap,
  Database,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/store";
import { getProducts, getParties, getDashboardMetrics, getInvoices } from "@/lib/store";
import type { Product, Party, Invoice } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    type?: "text" | "data" | "chart" | "action";
    data?: Array<{ label: string; value: string }>;
    suggestions?: string[];
  };
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const QUICK_ACTIONS = [
  { label: "Check Low Stock", icon: AlertTriangle, prompt: "Show me all products with low stock" },
  { label: "Today's Sales", icon: TrendingUp, prompt: "What are today's sales figures?" },
  { label: "Top Products", icon: Package, prompt: "Which products are selling the most?" },
  { label: "Generate Report", icon: BarChart3, prompt: "Generate a sales report for this month" },
];

export default function AIAssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "default",
      title: "New Conversation",
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! I'm your StockBuddy AI Assistant, specialized in inventory management. I have access to your complete inventory data, sales records, purchase history, and customer information.\n\nI can help you with:\n• Inventory analysis and stock management\n• Sales trends and forecasting\n• Purchase order recommendations\n• Customer insights and receivables\n• Report generation and data visualization\n• GST calculations and compliance\n• Business insights and recommendations\n\nHow can I assist you today?",
          timestamp: new Date(),
          metadata: {
            type: "text",
            suggestions: [
              "Show me products running low on stock",
              "What were my sales yesterday?",
              "Which customers owe me money?",
              "Suggest products to reorder",
            ],
          },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  const [currentConversationId, setCurrentConversationId] = useState("default");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load real data
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardMetrics,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const { data: parties } = useQuery({
    queryKey: ["parties"],
    queryFn: () => getParties(),
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(),
  });

  const currentConversation = conversations.find((c) => c.id === currentConversationId)!;
  const messages = currentConversation.messages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    updateConversation(currentConversationId, [...messages, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI processing with real data
    setTimeout(() => {
      const response = generateIntelligentResponse(
        userMessage.content,
        products || [],
        parties || [],
        invoices || []
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata,
      };

      updateConversation(currentConversationId, [...messages, userMessage, aiMessage]);
      setIsLoading(false);
    }, 1200 + Math.random() * 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => handleSend(), 100);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const updateConversation = (id: string, newMessages: Message[]) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id
          ? {
              ...conv,
              messages: newMessages,
              updatedAt: new Date(),
              title:
                newMessages.length > 1 && conv.title === "New Conversation"
                  ? newMessages[1].content.slice(0, 50) + "..."
                  : conv.title,
            }
          : conv
      )
    );
  };

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [
        {
          id: "welcome-" + Date.now(),
          role: "assistant",
          content: "Hello! How can I help you with your inventory today?",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
  };

  const deleteConversation = (id: string) => {
    if (conversations.length === 1) return;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(conversations[0].id === id ? conversations[1].id : conversations[0].id);
    }
  };

  const clearCurrentConversation = () => {
    updateConversation(currentConversationId, [
      {
        id: "cleared-" + Date.now(),
        role: "assistant",
        content: "Conversation cleared. How can I help you?",
        timestamp: new Date(),
      },
    ]);
  };

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportConversation = () => {
    const text = messages
      .map((m) => `[${m.role.toUpperCase()}] ${m.timestamp.toLocaleString()}\n${m.content}\n`)
      .join("\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${currentConversation.title.slice(0, 20)}-${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50/30 via-background to-violet-50/30">
      {/* Sidebar - Conversations */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b border-border">
          <Button
            onClick={createNewConversation}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                  currentConversationId === conv.id
                    ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-100"
                    : "hover:bg-muted"
                )}
                onClick={() => setCurrentConversationId(conv.id)}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{conv.title}</span>
                {conversations.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">AI Assistant</h1>
                <p className="text-xs text-muted-foreground">
                  Powered by advanced inventory intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </Badge>
              <Button variant="outline" size="sm" onClick={exportConversation}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={clearCurrentConversation}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Quick Actions - Show only at start */}
            {messages.length === 1 && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {QUICK_ACTIONS.map((action) => (
                  <Card
                    key={action.label}
                    className="cursor-pointer hover:shadow-md transition-all hover:border-indigo-300 group"
                    onClick={() => handleQuickAction(action.prompt)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-100 p-2 group-hover:bg-indigo-200 transition-colors">
                        <action.icon className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{action.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCopy={copyMessage}
                copiedId={copiedId}
                onSuggestionClick={handleSuggestionClick}
              />
            ))}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <Card className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                      <span className="text-sm text-muted-foreground">
                        Analyzing your inventory data...
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-card/80 backdrop-blur-sm px-6 py-4 shrink-0">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything about your inventory, sales, purchases, or customers..."
                  className="min-h-[52px] max-h-[200px] resize-none rounded-xl border-border bg-background px-4 py-3 pr-24 text-sm focus-visible:ring-indigo-500"
                  disabled={isLoading}
                  rows={1}
                />
                <div className="absolute right-2 bottom-2 flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled>
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled>
                    <Mic className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[52px] w-[52px] shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Connected to live inventory data
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Real-time insights
                </span>
              </div>
              <span>AI can make mistakes. Verify important information.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onCopy,
  copiedId,
  onSuggestionClick,
}: {
  message: Message;
  onCopy: (content: string, id: string) => void;
  copiedId: string | null;
  onSuggestionClick: (suggestion: string) => void;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <Badge variant="secondary" className="text-xs">
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg",
          isUser
            ? "bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-emerald-500/25"
            : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/25"
        )}
      >
        {isUser ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
      </div>

      <div className={cn("flex max-w-[85%] flex-col gap-2", isUser && "items-end")}>
        <Card
          className={cn(
            "relative group",
            isUser
              ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 border-0"
              : "bg-card"
          )}
        >
          <CardContent className="p-4">
            <div className={cn("text-sm leading-relaxed whitespace-pre-wrap", isUser && "text-white")}>
              {message.content}
            </div>

            {/* Data visualization for assistant messages */}
            {!isUser && message.metadata?.data && (
              <div className="mt-4 pt-4 border-t border-border">
                <DataDisplay data={message.metadata.data} />
              </div>
            )}

            {/* Suggestions */}
            {!isUser && message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {message.metadata.suggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => onSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>

          {/* Action buttons */}
          <div
            className={cn(
              "absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
              isUser && "right-auto left-0"
            )}
          >
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 rounded-lg"
              onClick={() => onCopy(message.content, message.id)}
            >
              {copiedId === message.id ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </Card>

        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && message.metadata?.type && (
            <Badge variant="outline" className="text-xs h-5">
              {message.metadata.type}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function DataDisplay({ data }: { data: Array<{ label: string; value: string }> }) {
  return (
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
        >
          <span className="font-medium">{item.label}</span>
          <span className="text-muted-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function generateIntelligentResponse(
  userInput: string,
  products: Product[],
  parties: Party[],
  invoices: Invoice[]
): { content: string; metadata?: { type?: "text" | "data" | "chart" | "action"; data?: Array<{ label: string; value: string }>; suggestions?: string[] } } {
  const input = userInput.toLowerCase();

  // Low Stock Analysis
  if (input.includes("low stock") || input.includes("running low") || input.includes("reorder")) {
    const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);
    
    if (lowStockProducts.length === 0) {
      return {
        content: "Great news! All your products are adequately stocked. No items are currently below their minimum threshold.",
        metadata: { type: "data" },
      };
    }

    const criticalItems = lowStockProducts.filter((p) => p.stock === 0);
    const warningItems = lowStockProducts.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold);

    let response = `I found ${lowStockProducts.length} product(s) that need attention:\n\n`;
    
    if (criticalItems.length > 0) {
      response += `🔴 CRITICAL - Out of Stock (${criticalItems.length} items):\n`;
      criticalItems.slice(0, 5).forEach((p) => {
        response += `• ${p.name} - Stock: ${p.stock} (Min: ${p.lowStockThreshold})\n`;
      });
      response += "\n";
    }

    if (warningItems.length > 0) {
      response += `⚠️ WARNING - Low Stock (${warningItems.length} items):\n`;
      warningItems.slice(0, 5).forEach((p) => {
        response += `• ${p.name} - Stock: ${p.stock} (Min: ${p.lowStockThreshold})\n`;
      });
    }

    const totalReorderValue = lowStockProducts.reduce((sum, p) => {
      const needed = p.lowStockThreshold * 2 - p.stock;
      return sum + needed * p.costPrice;
    }, 0);

    response += `\n💰 Estimated reorder cost: ${formatCurrency(totalReorderValue)}`;
    response += `\n\nWould you like me to help you create purchase orders for these items?`;

    return {
      content: response,
      metadata: {
        type: "data",
        data: lowStockProducts.slice(0, 10).map((p) => ({
          label: p.name,
          value: `Stock: ${p.stock} / Min: ${p.lowStockThreshold}`,
        })),
        suggestions: ["Create purchase order", "Show supplier details", "View product details"],
      },
    };
  }

  // Sales Analysis
  if (input.includes("sales") || input.includes("revenue") || input.includes("sold")) {
    const salesInvoices = invoices.filter((i) => i.type === "sale");
    const today = new Date().toISOString().split("T")[0];
    const todaySales = salesInvoices.filter((i) => i.date.startsWith(today));
    
    const totalSalesToday = todaySales.reduce((sum, i) => sum + i.grandTotal, 0);
    const totalSalesMonth = salesInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const avgSaleValue = salesInvoices.length > 0 ? totalSalesMonth / salesInvoices.length : 0;

    let response = `📊 Sales Performance Overview:\n\n`;
    response += `Today's Sales: ${formatCurrency(totalSalesToday)}\n`;
    response += `Total Invoices Today: ${todaySales.length}\n\n`;
    response += `Monthly Sales: ${formatCurrency(totalSalesMonth)}\n`;
    response += `Total Invoices: ${salesInvoices.length}\n`;
    response += `Average Sale Value: ${formatCurrency(avgSaleValue)}\n\n`;

    // Payment status
    const paidInvoices = salesInvoices.filter((i) => i.status === "paid").length;
    const unpaidInvoices = salesInvoices.filter((i) => i.status === "unpaid").length;
    const partialInvoices = salesInvoices.filter((i) => i.status === "partial").length;

    response += `Payment Status:\n`;
    response += `✅ Paid: ${paidInvoices} invoices\n`;
    response += `⏳ Partial: ${partialInvoices} invoices\n`;
    response += `❌ Unpaid: ${unpaidInvoices} invoices\n`;

    return {
      content: response,
      metadata: {
        type: "data",
        suggestions: ["Show top selling products", "View unpaid invoices", "Generate sales report"],
      },
    };
  }

  // Top Products
  if (input.includes("top") && (input.includes("product") || input.includes("selling"))) {
    const salesInvoices = invoices.filter((i) => i.type === "sale");
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    salesInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    let response = `🏆 Top 10 Selling Products:\n\n`;
    topProducts.forEach((p, idx) => {
      response += `${idx + 1}. ${p.name}\n`;
      response += `   Quantity Sold: ${p.quantity} units\n`;
      response += `   Revenue: ${formatCurrency(p.revenue)}\n\n`;
    });

    return {
      content: response,
      metadata: {
        type: "data",
        data: topProducts.map((p, idx) => ({
          label: `${idx + 1}. ${p.name}`,
          value: formatCurrency(p.revenue),
        })),
        suggestions: ["Show product details", "Check stock levels", "View sales trend"],
      },
    };
  }

  // Customer/Party Analysis
  if (input.includes("customer") || input.includes("party") || input.includes("receivable") || input.includes("owe")) {
    const customers = parties.filter((p) => p.type === "customer");
    const customersWithBalance = customers.filter((c) => c.balance > 0);
    const totalReceivables = customersWithBalance.reduce((sum, c) => sum + c.balance, 0);

    let response = `👥 Customer Overview:\n\n`;
    response += `Total Customers: ${customers.length}\n`;
    response += `Customers with Outstanding Balance: ${customersWithBalance.length}\n`;
    response += `Total Receivables: ${formatCurrency(totalReceivables)}\n\n`;

    if (customersWithBalance.length > 0) {
      response += `Top Outstanding Balances:\n`;
      customersWithBalance
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 5)
        .forEach((c) => {
          response += `• ${c.name}: ${formatCurrency(c.balance)}\n`;
          response += `  Phone: ${c.phone}\n`;
        });
    }

    return {
      content: response,
      metadata: {
        type: "data",
        data: customersWithBalance.slice(0, 10).map((c) => ({
          label: c.name,
          value: formatCurrency(c.balance),
        })),
        suggestions: ["Send payment reminders", "View customer details", "Generate receivables report"],
      },
    };
  }

  // Supplier Analysis
  if (input.includes("supplier") || input.includes("payable") || input.includes("we owe")) {
    const suppliers = parties.filter((p) => p.type === "supplier");
    const suppliersWithBalance = suppliers.filter((s) => s.balance < 0);
    const totalPayables = suppliersWithBalance.reduce((sum, s) => sum + Math.abs(s.balance), 0);

    let response = `🏭 Supplier Overview:\n\n`;
    response += `Total Suppliers: ${suppliers.length}\n`;
    response += `Suppliers with Outstanding Payables: ${suppliersWithBalance.length}\n`;
    response += `Total Payables: ${formatCurrency(totalPayables)}\n\n`;

    if (suppliersWithBalance.length > 0) {
      response += `Top Outstanding Payables:\n`;
      suppliersWithBalance
        .sort((a, b) => a.balance - b.balance)
        .slice(0, 5)
        .forEach((s) => {
          response += `• ${s.name}: ${formatCurrency(Math.abs(s.balance))}\n`;
          response += `  Phone: ${s.phone}\n`;
        });
    }

    return {
      content: response,
      metadata: {
        type: "data",
        data: suppliersWithBalance.slice(0, 10).map((s) => ({
          label: s.name,
          value: formatCurrency(Math.abs(s.balance)),
        })),
        suggestions: ["Schedule payments", "View supplier details", "Generate payables report"],
      },
    };
  }

  // Inventory Overview
  if (input.includes("inventory") || input.includes("stock") || input.includes("products")) {
    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
    const totalCostValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
    const potentialProfit = totalStockValue - totalCostValue;

    const categories = [...new Set(products.map((p) => p.category))];
    const categoryBreakdown = categories.map((cat) => {
      const catProducts = products.filter((p) => p.category === cat);
      return {
        category: cat,
        count: catProducts.length,
        value: catProducts.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0),
      };
    });

    let response = `📦 Inventory Overview:\n\n`;
    response += `Total Products: ${totalProducts}\n`;
    response += `Total Stock Value (Selling Price): ${formatCurrency(totalStockValue)}\n`;
    response += `Total Cost Value: ${formatCurrency(totalCostValue)}\n`;
    response += `Potential Profit Margin: ${formatCurrency(potentialProfit)}\n\n`;
    response += `Categories:\n`;
    categoryBreakdown
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .forEach((cat) => {
        response += `• ${cat.category}: ${cat.count} products (${formatCurrency(cat.value)})\n`;
      });

    return {
      content: response,
      metadata: {
        type: "data",
        data: categoryBreakdown.slice(0, 8).map((cat) => ({
          label: cat.category,
          value: `${cat.count} items`,
        })),
        suggestions: ["Check low stock", "View by category", "Generate inventory report"],
      },
    };
  }

  // Purchase Analysis
  if (input.includes("purchase") || input.includes("bought")) {
    const purchaseInvoices = invoices.filter((i) => i.type === "purchase");
    const totalPurchases = purchaseInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const avgPurchaseValue = purchaseInvoices.length > 0 ? totalPurchases / purchaseInvoices.length : 0;

    let response = `🛒 Purchase Overview:\n\n`;
    response += `Total Purchases: ${formatCurrency(totalPurchases)}\n`;
    response += `Number of Purchase Orders: ${purchaseInvoices.length}\n`;
    response += `Average Purchase Value: ${formatCurrency(avgPurchaseValue)}\n\n`;

    // Recent purchases
    const recentPurchases = purchaseInvoices.slice(0, 5);
    if (recentPurchases.length > 0) {
      response += `Recent Purchases:\n`;
      recentPurchases.forEach((p) => {
        response += `• ${p.invoiceNumber} - ${p.partyName}\n`;
        response += `  Amount: ${formatCurrency(p.grandTotal)} | Status: ${p.status}\n`;
      });
    }

    return {
      content: response,
      metadata: {
        type: "data",
        suggestions: ["View purchase details", "Check supplier payables", "Generate purchase report"],
      },
    };
  }

  // GST/Tax queries
  if (input.includes("gst") || input.includes("tax")) {
    const salesInvoices = invoices.filter((i) => i.type === "sale");
    const totalGSTCollected = salesInvoices.reduce((sum, i) => sum + i.totalGst, 0);
    
    const purchaseInvoices = invoices.filter((i) => i.type === "purchase");
    const totalGSTPaid = purchaseInvoices.reduce((sum, i) => sum + i.totalGst, 0);
    
    const netGST = totalGSTCollected - totalGSTPaid;

    let response = `💼 GST Overview:\n\n`;
    response += `GST Collected (Sales): ${formatCurrency(totalGSTCollected)}\n`;
    response += `GST Paid (Purchases): ${formatCurrency(totalGSTPaid)}\n`;
    response += `Net GST Liability: ${formatCurrency(netGST)}\n\n`;
    response += `This is the amount you need to pay to the government after claiming input tax credit.\n`;

    return {
      content: response,
      metadata: {
        type: "data",
        suggestions: ["Generate GST report", "View tax breakdown", "Download GSTR-1 data"],
      },
    };
  }

  // Report Generation
  if (input.includes("report") || input.includes("generate")) {
    let response = `📊 Available Reports:\n\n`;
    response += `I can generate the following reports for you:\n\n`;
    response += `1. Sales Report - Detailed sales analysis with trends\n`;
    response += `2. Purchase Report - Purchase history and supplier analysis\n`;
    response += `3. Inventory Report - Stock valuation and movement\n`;
    response += `4. GST Report - Tax collected and paid breakdown\n`;
    response += `5. Profit & Loss - Revenue vs expenses analysis\n`;
    response += `6. Customer Ledger - Individual customer transactions\n`;
    response += `7. Supplier Ledger - Individual supplier transactions\n`;
    response += `8. Low Stock Alert - Products needing reorder\n\n`;
    response += `Which report would you like me to generate?`;

    return {
      content: response,
      metadata: {
        type: "text",
        suggestions: ["Sales report", "Inventory report", "GST report", "Profit & Loss"],
      },
    };
  }

  // Business Insights
  if (input.includes("insight") || input.includes("recommend") || input.includes("suggest") || input.includes("advice")) {
    const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;
    const salesInvoices = invoices.filter((i) => i.type === "sale");
    const unpaidInvoices = salesInvoices.filter((i) => i.status === "unpaid" || i.status === "partial");
    const totalReceivables = parties
      .filter((p) => p.type === "customer")
      .reduce((sum, c) => sum + Math.max(0, c.balance), 0);

    let response = `💡 Business Insights & Recommendations:\n\n`;

    // Critical issues
    if (lowStockCount > 0) {
      response += `⚠️ URGENT: ${lowStockCount} products are running low on stock. Consider reordering to avoid stockouts.\n\n`;
    }

    if (unpaidInvoices.length > 0) {
      response += `💰 You have ${unpaidInvoices.length} unpaid/partial invoices worth ${formatCurrency(
        unpaidInvoices.reduce((sum, i) => sum + (i.grandTotal - i.amountPaid), 0)
      )}. Follow up with customers for payment.\n\n`;
    }

    // Positive insights
    const topCategory = products.reduce((acc: Record<string, number>, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
    const mostStockedCategory = Object.entries(topCategory).sort((a, b) => (b[1] as number) - (a[1] as number))[0];

    response += `📈 Your most stocked category is ${mostStockedCategory[0]} with ${mostStockedCategory[1]} products.\n\n`;

    // Recommendations
    response += `Recommendations:\n`;
    response += `1. Set up automated low-stock alerts\n`;
    response += `2. Review pricing for slow-moving items\n`;
    response += `3. Implement a payment reminder system\n`;
    response += `4. Analyze seasonal trends for better forecasting\n`;
    response += `5. Consider bulk purchase discounts from suppliers\n`;

    return {
      content: response,
      metadata: {
        type: "text",
        suggestions: ["Show low stock items", "View unpaid invoices", "Analyze sales trends"],
      },
    };
  }

  // Product search
  if (input.includes("find") || input.includes("search") || input.includes("show me")) {
    // Try to extract product name
    const searchTerms = input.split(" ").filter((w) => w.length > 3);
    const matchedProducts = products.filter((p) =>
      searchTerms.some((term) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term))
    );

    if (matchedProducts.length > 0) {
      let response = `🔍 Found ${matchedProducts.length} matching product(s):\n\n`;
      matchedProducts.slice(0, 5).forEach((p) => {
        response += `📦 ${p.name}\n`;
        response += `   SKU: ${p.sku}\n`;
        response += `   Category: ${p.category}\n`;
        response += `   Stock: ${p.stock} ${p.unit}\n`;
        response += `   Price: ${formatCurrency(p.sellingPrice)} (MRP: ${formatCurrency(p.mrp)})\n`;
        response += `   GST: ${p.gstRate}%\n\n`;
      });

      return {
        content: response,
        metadata: {
          type: "data",
          suggestions: ["Add to cart", "Update stock", "View sales history"],
        },
      };
    }
  }

  // Default response with context
  const context = {
    totalProducts: products.length,
    totalCustomers: parties.filter((p) => p.type === "customer").length,
    totalSuppliers: parties.filter((p) => p.type === "supplier").length,
    totalInvoices: invoices.length,
  };

  let response = `I'm here to help you manage your inventory business! Here's what I know about your business:\n\n`;
  response += `📊 Quick Stats:\n`;
  response += `• ${context.totalProducts} products in inventory\n`;
  response += `• ${context.totalCustomers} customers\n`;
  response += `• ${context.totalSuppliers} suppliers\n`;
  response += `• ${context.totalInvoices} total transactions\n\n`;
  response += `I can help you with:\n`;
  response += `• Inventory management and stock alerts\n`;
  response += `• Sales and purchase analysis\n`;
  response += `• Customer and supplier management\n`;
  response += `• Financial reports and GST calculations\n`;
  response += `• Business insights and recommendations\n\n`;
  response += `What would you like to know?`;

  return {
    content: response,
    metadata: {
      type: "text",
      suggestions: [
        "Show low stock items",
        "Today's sales summary",
        "Top selling products",
        "Customer receivables",
      ],
    },
  };
}
