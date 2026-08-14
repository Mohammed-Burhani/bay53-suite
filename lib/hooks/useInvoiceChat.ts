import { useState, useCallback, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiAssistantCache, getIdFieldForModule, summarizeForAI } from "@/lib/ai-assistant-cache";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

interface UseInvoiceChatProps {
  data: unknown[]; // Generic data array (invoices, products, parties, etc.)
  moduleName: string; // "Sales", "Inventory", "Parties", etc.
}

export function useInvoiceChat({ data, moduleName }: UseInvoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<ReturnType<
    ReturnType<
      typeof GoogleGenerativeAI.prototype.getGenerativeModel
    >["startChat"]
  > | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cacheStats, setCacheStats] = useState<{ added: number; updated: number; unchanged: number } | null>(null);

  // Refs to avoid stale closures
  const dataRef = useRef(data);
  const moduleNameRef = useRef(moduleName);
  const chatRef = useRef(chat);

  dataRef.current = data;
  moduleNameRef.current = moduleName;
  chatRef.current = chat;

  // Initialize Gemini chat session with cached data
  const getOrCreateChat = useCallback(async () => {
    if (chatRef.current) return chatRef.current;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      throw new Error("Gemini API key not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });

    // Smart merge with cache
    const idField = getIdFieldForModule(moduleNameRef.current);
    const { mergedData, hasChanges, stats } = await aiAssistantCache.smartMerge(
      moduleNameRef.current,
      dataRef.current,
      idField
    );

    setCacheStats(stats);
    setIsInitialized(true);

    // Inject merged data as system context - use summarized data for AI efficiency
    // Only use mergedData if it has content; otherwise tell user to load data
    const hasData = mergedData && mergedData.length > 0;
    let dataContext: string;
    if (hasData) {
      const { summary, sample } = summarizeForAI(mergedData, moduleNameRef.current);
      dataContext = `Here is the ${moduleNameRef.current} data summary:\n${JSON.stringify(summary, null, 2)}\n\nRepresentative sample (${sample.length} of ${mergedData.length} records):\n${JSON.stringify(sample, null, 2)}`;
    } else {
      dataContext = `No ${moduleNameRef.current} data loaded yet. User needs to load data first.`;
    }

    const newChat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: `You are a ${moduleNameRef.current} Assistant.

${dataContext}

Rules:
- If no data loaded: Tell user to load data first
- Be concise and clear
- Format numbers as currency (₹)
- Use markdown formatting: **bold**, ## headings, - lists, > quotes
- If asked for a list, show max 5 items unless specified
- Today's date: ${new Date().toDateString()}
- Module context: ${moduleNameRef.current}
- Provide insights like totals, trends, top items, analysis
- If data exists but query has no matches, say so clearly
- Never mention or reveal that data comes from a cache, local storage, or previous sessions. Always respond as if you have the complete current dataset.`,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: hasData
                ? `Got it! I'm ready to answer questions about your ${moduleNameRef.current.toLowerCase()} data. I can help with analysis, summaries, and insights.`
                : `Hi! I'm ready to help with your ${moduleNameRef.current.toLowerCase()} data. Please load data first, then I can answer your questions.`,
            },
          ],
        },
      ],
    });

    chatRef.current = newChat;
    setChat(newChat);
    return newChat;
  }, []);

  const sendMessage = async (userText: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: "user" as const, text: userText, timestamp: new Date() },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const chatSession = await getOrCreateChat();
      const result = await chatSession.sendMessage(userText);
      const reply = result.response.text();

      setMessages([
        ...newMessages,
        { role: "model", text: reply, timestamp: new Date() },
      ]);
    } catch (err) {
      const errorMsg =
        err instanceof Error && err.message.includes("API key")
          ? "⚠️ Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to .env.local"
          : "Something went wrong. Please try again.";

      setMessages([
        ...newMessages,
        {
          role: "model",
          text: errorMsg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setChat(null);
    chatRef.current = null;
    setIsInitialized(false);
    setCacheStats(null);
  };

  // Reset chat when data changes significantly
  useEffect(() => {
    if (chatRef.current) {
      setChat(null);
      chatRef.current = null;
      setMessages([]);
      setIsInitialized(false);
      setCacheStats(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  return { messages, loading, sendMessage, clearChat, isInitialized, cacheStats };
}
