import { useState, useCallback, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

interface UseInvoiceChatProps {
  invoices: unknown[];
  invoiceType: string; // "Sales", "Purchase", "All", etc.
}

export function useInvoiceChat({ invoices, invoiceType }: UseInvoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<ReturnType<
    ReturnType<
      typeof GoogleGenerativeAI.prototype.getGenerativeModel
    >["startChat"]
  > | null>(null);

  // Initialize Gemini chat session once
  const getOrCreateChat = useCallback(() => {
    if (chat) return chat;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      throw new Error("Gemini API key not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Change "gemini-3.1-pro-preview" to "gemini-3.1-flash-lite-preview"
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });

    // Inject invoice data as system context
    const hasData = invoices && invoices.length > 0;
    const dataContext = hasData 
      ? `Here is the invoice data:\n${JSON.stringify(invoices, null, 2)}`
      : `No invoice data loaded yet. User needs to click "Search" button to load invoices first.`;

    const newChat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: `You are a ${invoiceType} Invoice Assistant.

${dataContext}

Rules:
- If no data loaded: Tell user to click "Search" button to load invoices first
- Be concise and clear
- Format numbers as currency (₹)
- If asked for a list, show max 5 items unless specified
- Today's date: ${new Date().toDateString()}
- Invoice type context: ${invoiceType}
- Provide insights like totals, trends, top parties, unpaid amounts
- If data exists but query has no matches, say so clearly`,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: hasData 
                ? `Got it! I'm ready to answer questions about your ${invoiceType.toLowerCase()} invoices. I can help with totals, party analysis, date ranges, and more.`
                : `Hi! I'm ready to help with your ${invoiceType.toLowerCase()} invoices. Please click the "Search" button above to load invoice data first, then I can answer your questions.`,
            },
          ],
        },
      ],
    });

    setChat(newChat);
    return newChat;
  }, [chat, invoices, invoiceType]);

  const sendMessage = async (userText: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: "user" as const, text: userText, timestamp: new Date() },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const chatSession = getOrCreateChat();
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
  };

  // Reset chat when invoice data changes
  useEffect(() => {
    if (chat) {
      setChat(null);
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices.length]);

  return { messages, loading, sendMessage, clearChat };
}
