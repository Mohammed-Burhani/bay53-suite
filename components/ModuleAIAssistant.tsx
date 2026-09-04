"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Send,
  Sparkles,
  User,
  Bot,
  Edit,
  RotateCcw,
  Copy,
  Check,
  Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvoiceChat } from "@/lib/hooks/useInvoiceChat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// Use default markdown rendering - the AI decides formatting automatically


export interface ModuleAIAssistantProps {
  moduleName: string;
  moduleData: Record<string, unknown>;
  dataKey?: string; // Optional key to specify which data array to use
  onAgenticAction?: (action: string, params: Record<string, unknown>) => Promise<void>;
}

export interface ModuleAIAssistantProps {
  moduleName: string;
  moduleData: Record<string, unknown>;
  dataKey?: string; // Optional key to specify which data array to use
  onAgenticAction?: (action: string, params: Record<string, unknown>) => Promise<void>;
}

function extractDataArray(moduleData: Record<string, unknown>, dataKey?: string): unknown[] {
  if (dataKey && moduleData[dataKey]) {
    const value = moduleData[dataKey];
    return Array.isArray(value) ? value : [];
  }

  for (const key of Object.keys(moduleData)) {
    const value = moduleData[key];
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }

  return [];
}

export function ModuleAIAssistant({
  moduleName,
  moduleData,
  dataKey,
  onAgenticAction,
}: ModuleAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract data array from moduleData (flexible - handles different data structures)
  const dataArray = useMemo(() => extractDataArray(moduleData, dataKey), [moduleData, dataKey]);

  // Use Gemini chat hook (owns message state, threading, editing)
  const { messages, loading, sendMessage, editMessage, regenerate, clearChat } = useInvoiceChat({
    data: dataArray,
    moduleName,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  }, [input, loading, sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Start editing an existing user message (inline input appears on the bubble)
  const handleEditMessage = useCallback((messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message || message.role !== "user") return;
    setEditingMessageId(messageId);
    setEditInput(message.text);
  }, [messages]);

  // Save an edit -> branches a new thread from that message
  const handleSaveEdit = useCallback(async () => {
    if (!editingMessageId || !editInput.trim() || loading) return;
    const id = editingMessageId;
    const text = editInput;
    setEditingMessageId(null);
    setEditInput("");
    await editMessage(id, text);
  }, [editingMessageId, editInput, loading, editMessage]);

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditInput("");
  };

  const handleCopy = useCallback(async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleClearChat = useCallback(() => {
    if (loading) return;
    clearChat();
    setEditingMessageId(null);
    setEditInput("");
    toast.info("Chat cleared");
  }, [clearChat, loading]);

  // Find which model message is the last one (only it gets a regenerate button)
  const lastModelId = useMemo(() => {
    let last: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "model") {
        last = messages[i].id;
        break;
      }
    }
    return last;
  }, [messages]);

  // Suggested questions based on module type
  const suggestions = [
    "Show total amount",
    "Top 5 parties by amount",
    "Unpaid invoices",
    "This month's summary",
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">{moduleName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                disabled={messages.length === 0 || loading}
                title="Clear chat"
                className="h-8 w-8"
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-3 font-medium text-foreground">
                    Ask me about your {moduleName.toLowerCase()}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 text-left">Quick Questions</p>
                      <div className="space-y-2">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setInput(s);
                              handleSend();
                            }}
                            className="block w-full text-xs border rounded-lg px-3 py-2 hover:bg-blue-50 hover:border-blue-300 transition text-left"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  const isEditing = editingMessageId === message.id;
                  const isLastModel = message.role === "model" && message.id === lastModelId;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className="flex flex-col gap-1 max-w-[75%]">
                        {/* Avatar row */}
                        <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
                          {message.role === "model" && (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "rounded-lg px-3 py-2 wrap-break-word",
                              isUser
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                            )}
                          >
                            {/* Editing state (inline input replaces the bubble content) */}
                            {isEditing && isUser ? (
                              <div className="space-y-2">
                                <Input
                                  value={editInput}
                                  onChange={(e) => setEditInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveEdit();
                                    if (e.key === "Escape") handleCancelEdit();
                                  }}
                                  autoFocus
                                  className="max-w-full bg-white dark:bg-gray-900 text-foreground"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    disabled={loading || !editInput.trim()}
                                  >
                                    <Check className="h-3 w-3 mr-1" /> Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                    <X className="h-3 w-3 mr-1" /> Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {message.role === "model" ? (
                                  <div className="text-sm max-w-none">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      rehypePlugins={[rehypeRaw]}
                                    >
                                      {message.text}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap wrap-break-word">
                                    {message.text}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          {message.role === "user" && (
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Action bar below the bubble */}
                        {!isEditing && (
                          <div className={cn("flex gap-1 text-xs text-muted-foreground", isUser ? "justify-end" : "justify-start")}>
                            {isUser && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0 hover:bg-transparent"
                                onClick={() => handleEditMessage(message.id)}
                                disabled={loading}
                                title="Edit message (starts a new thread from here)"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {isLastModel && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0 hover:bg-transparent"
                                onClick={regenerate}
                                disabled={loading}
                                title="Regenerate response"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 hover:bg-transparent"
                              onClick={() => handleCopy(message.id, message.text)}
                              title="Copy"
                            >
                              {copiedId === message.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Timestamp & edit indicator */}
                        <div className={cn("flex items-center gap-1 text-xs opacity-60", isUser ? "justify-end" : "justify-start")}>
                          <span>{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          {message.editHistory && message.editHistory.length > 0 && (
                            <span className="text-xs opacity-70">(edited)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-2 justify-start">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-800">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
