"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  User,
  Zap,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIQueryProcessor } from "@/lib/ai-query-processor";

export type AIMode = "chat" | "agentic";

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ModuleAIAssistantProps {
  moduleName: string;
  moduleData: Record<string, unknown>;
  onAgenticAction?: (action: string, params: Record<string, unknown>) => Promise<void>;
}

export function ModuleAIAssistant({
  moduleName,
  moduleData,
  onAgenticAction,
}: ModuleAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AIMode>("chat");
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const processQuery = async (query: string) => {
    setIsProcessing(true);

    try {
      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const processor = new AIQueryProcessor({
        moduleName,
        ...moduleData,
      });

      const result = await processor.processQuery(query, mode);

      // If agentic mode and action is present, execute it
      if (mode === "agentic" && result.action && onAgenticAction) {
        try {
          await onAgenticAction(result.action.type, result.action.params);
        } catch {
          result.response += "\n\n⚠️ Action execution failed. Please try again.";
        }
      }

      const assistantMessage: AIMessage = {
        id: Date.now().toString() + "-assistant",
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: AIMessage = {
        id: Date.now().toString() + "-error",
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    await processQuery(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        >
          <Bot className="h-6! w-6! animate-bounce" />
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">{moduleName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-3 border-b bg-muted/30">
            <Button
              variant={mode === "chat" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("chat")}
              className="flex-1"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Chat
            </Button>
            <Button
              variant={mode === "agentic" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("agentic")}
              className="flex-1"
            >
              <Zap className="h-3 w-3 mr-1" />
              Agentic
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-1">
                    {mode === "chat"
                      ? "Ask me anything about your data"
                      : "Tell me what to do"}
                  </p>
                  <p className="text-xs">
                    {mode === "chat"
                      ? "I'll answer questions about your inventory"
                      : "I'll perform actions for you"}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 max-w-[75%] break-words",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex gap-2 justify-start">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-muted">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
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
            {mode === "agentic" && (
              <Badge variant="secondary" className="mb-2 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Agentic mode: I can perform actions
              </Badge>
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  mode === "chat"
                    ? "Ask a question..."
                    : "Tell me what to do..."
                }
                disabled={isProcessing}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
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
