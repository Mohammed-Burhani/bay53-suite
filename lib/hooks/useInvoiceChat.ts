import { useState, useCallback, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiAssistantCache, getIdFieldForModule, summarizeForAI } from "@/lib/ai-assistant-cache";

export interface ChatMessage {
  id: string; // stable id for React keys + editing targets
  role: "user" | "model";
  text: string;
  timestamp: Date;
  editHistory?: string[]; // previous versions of an edited user message (threading)
}

interface UseInvoiceChatProps {
  data: unknown[]; // Generic data array (invoices, products, parties, etc.)
  moduleName: string; // "Sales", "Inventory", "Parties", etc.
}

type GeminiModel = ReturnType<typeof GoogleGenerativeAI.prototype.getGenerativeModel>;
type GeminiChat = ReturnType<GeminiModel["startChat"]>;

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `msg-${Date.now()}-${idCounter}`;
}

export function useInvoiceChat({ data, moduleName }: UseInvoiceChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cacheStats, setCacheStats] = useState<{ added: number; updated: number; unchanged: number } | null>(null);

  // Refs to avoid stale closures (kept fresh each render)
  const dataRef = useRef(data);
  const moduleNameRef = useRef(moduleName);
  const chatRef = useRef<GeminiChat | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const loadingRef = useRef(false);
  const systemPromptRef = useRef<string | null>(null);
  const greetingRef = useRef<string>("");

  dataRef.current = data;
  moduleNameRef.current = moduleName;
  messagesRef.current = messages;
  loadingRef.current = loading;

  // Build the system prompt once (reads + smart-merges the cache). Cached in a ref
  // so branching/regenerating don't re-run the merge.
  const buildSystemPrompt = useCallback(async (): Promise<string> => {
    if (systemPromptRef.current) return systemPromptRef.current;

    const idField = getIdFieldForModule(moduleNameRef.current);
    const { mergedData, stats } = await aiAssistantCache.smartMerge(
      moduleNameRef.current,
      dataRef.current,
      idField
    );
    setCacheStats(stats);

    const hasData = mergedData && mergedData.length > 0;
    let dataContext: string;
    if (hasData) {
      const { summary, sample } = summarizeForAI(mergedData, moduleNameRef.current);
      dataContext = `Here is the ${moduleNameRef.current} data summary:\n${JSON.stringify(summary, null, 2)}\n\nRepresentative sample (${sample.length} of ${mergedData.length} records):\n${JSON.stringify(sample, null, 2)}`;
    } else {
      dataContext = `No ${moduleNameRef.current} data loaded yet. User needs to load data first.`;
    }

    systemPromptRef.current = `You are a ${moduleNameRef.current} Assistant.

${dataContext}

Rules:
- If no data loaded: Tell user to load data first
- Be concise and clear
- **Format ALL currency amounts in Indian Rupees (₹) using Indian numbering system:**
  - Use **lakhs (L)** and **crores (Cr)** for large amounts
  - Examples: ₹1,23,456 → "₹1.23 L", ₹1,23,45,678 → "₹1.23 Cr"
  - For exact amounts: "₹38,45,200" or "₹38.45 L"
  - Never use "million" or "billion" - always use lakhs/crores
- Use markdown formatting: **bold**, ## headings, - lists, > quotes
- If asked for a list, show max 5 items unless specified
- Today's date: ${new Date().toDateString()}
- Module context: ${moduleNameRef.current}
- Provide insights like totals, trends, top items, analysis
- If data exists but query has no matches, say so clearly
- Never mention or reveal that data comes from a cache, local storage, or previous sessions. Always respond as if you have the complete current dataset.`;

    greetingRef.current = hasData
      ? `Got it! I'm ready to answer questions about your ${moduleNameRef.current.toLowerCase()} data. I can help with analysis, summaries, and insights.`
      : `Hi! I'm ready to help with your ${moduleNameRef.current.toLowerCase()} data. Please load data first, then I can answer your questions.`;

    return systemPromptRef.current;
  }, []);

  /**
   * Get (or create) the Gemini chat session.
   * Pass `historyOverride` to rebuild the session from a specific point
   * (used for editing/regenerating so the model forgets the discarded turns).
   */
  const getOrCreateChat = useCallback(
    async (historyOverride?: ChatMessage[]): Promise<GeminiChat> => {
      const systemPrompt = await buildSystemPrompt();

      // Reuse existing session for normal sends (its internal history matches display)
      if (chatRef.current && !historyOverride) return chatRef.current;

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey || apiKey === "your_gemini_api_key_here") {
        throw new Error("Gemini API key not configured");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
      });

      const history = [
        { role: "user" as const, parts: [{ text: systemPrompt }] },
        { role: "model" as const, parts: [{ text: greetingRef.current }] },
        ...(historyOverride ?? []).map((m) => ({
          role: m.role as "user" | "model",
          parts: [{ text: m.text }],
        })),
      ];

      const newChat = model.startChat({ history });
      chatRef.current = newChat;
      setIsInitialized(true);
      return newChat;
    },
    [buildSystemPrompt]
  );

  // Shared message appender + error handler
  const appendModelReply = useCallback(
    (base: ChatMessage[], reply: string) => {
      setMessages([...base, { id: nextId(), role: "model", text: reply, timestamp: new Date() }]);
    },
    []
  );

  const buildErrorMessage = useCallback((err: unknown): string => {
    return err instanceof Error && err.message.includes("API key")
      ? "⚠️ Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to .env.local"
      : "Something went wrong. Please try again.";
  }, []);

  // Normal send: append user message, then model reply
  const sendMessage = useCallback(
    async (userText: string) => {
      if (loadingRef.current) return;

      const current = messagesRef.current;
      const newMessages: ChatMessage[] = [
        ...current,
        { id: nextId(), role: "user", text: userText, timestamp: new Date() },
      ];

      loadingRef.current = true;
      setMessages(newMessages);
      setLoading(true);

      try {
        const chatSession = await getOrCreateChat(); // reuse session, history already matches
        const result = await chatSession.sendMessage(userText);
        appendModelReply(newMessages, result.response.text());
      } catch (err) {
        appendModelReply(newMessages, buildErrorMessage(err));
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [getOrCreateChat, appendModelReply, buildErrorMessage]
  );

  /**
   * Edit a previously sent user message (threading):
   * - Keeps everything up to (but not including) the edited message
   * - Replaces the edited message with the new text (carrying old versions in editHistory)
   * - Discards all subsequent turns, rebuilds the session from that point, re-sends
   */
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      if (loadingRef.current) return;

      const current = messagesRef.current;
      const idx = current.findIndex((m) => m.id === messageId);
      if (idx === -1 || current[idx].role !== "user") return;

      const edited = current[idx];
      const historyForSession = current.slice(0, idx); // turns BEFORE the edited message
      const newUserMessage: ChatMessage = {
        id: nextId(),
        role: "user",
        text: newText,
        timestamp: new Date(),
        editHistory: [...(edited.editHistory ?? []), edited.text],
      };
      const newMessages = [...historyForSession, newUserMessage];

      loadingRef.current = true;
      setMessages(newMessages);
      setLoading(true);

      try {
        const chatSession = await getOrCreateChat(historyForSession); // rebuild from branch point
        const result = await chatSession.sendMessage(newText);
        appendModelReply(newMessages, result.response.text());
      } catch (err) {
        appendModelReply(newMessages, buildErrorMessage(err));
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [getOrCreateChat, appendModelReply, buildErrorMessage]
  );

  /**
   * Regenerate the last model reply:
   * - Truncates after the last user message, rebuilds the session, re-asks the same question
   */
  const regenerate = useCallback(async () => {
    if (loadingRef.current) return;

    const current = messagesRef.current;
    let lastUserIdx = -1;
    for (let i = current.length - 1; i >= 0; i--) {
      if (current[i].role === "user") {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return;

    const lastUserMsg = current[lastUserIdx];
    const historyForSession = current.slice(0, lastUserIdx);
    const newMessages = current.slice(0, lastUserIdx + 1); // keep through the last user msg

    loadingRef.current = true;
    setMessages(newMessages);
    setLoading(true);

    try {
      const chatSession = await getOrCreateChat(historyForSession);
      const result = await chatSession.sendMessage(lastUserMsg.text);
      appendModelReply(newMessages, result.response.text());
    } catch (err) {
      appendModelReply(newMessages, buildErrorMessage(err));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [getOrCreateChat, appendModelReply, buildErrorMessage]);

  const clearChat = useCallback(() => {
    chatRef.current = null;
    systemPromptRef.current = null;
    greetingRef.current = "";
    setMessages([]);
    setIsInitialized(false);
    setCacheStats(null);
  }, []);

  // Reset chat when data changes significantly (new dataset -> new context)
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current = null;
      systemPromptRef.current = null;
      setMessages([]);
      setIsInitialized(false);
      setCacheStats(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  return { messages, loading, sendMessage, editMessage, regenerate, clearChat, isInitialized, cacheStats };
}
