import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Link, AlertTriangle, HelpCircle } from "lucide-react";
import { ChatMessage, VaultDocument } from "../types";

interface InteractiveChatProps {
  documents: VaultDocument[];
  currentScenario?: string;
  vaultDocIds: string[];
  setVaultDocIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function InteractiveChat({
  documents,
  currentScenario,
  vaultDocIds,
  setVaultDocIds,
}: InteractiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init",
      role: "assistant",
      content: "Hello! I am your Sahur AI Assistant. I can help clarify specific sections of the Indian Constitution, decode clauses in your rental or labor agreements, or guide you on how to file grievances. What would you like to discuss today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const toggleDocLink = (id: string) => {
    setVaultDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const customKey = localStorage.getItem("gemini_api_key");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customKey && customKey.trim() !== "") {
        headers["x-gemini-api-key"] = customKey.trim();
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: input,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          scenario: currentScenario,
          vaultDocIds,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: "msg_reply_" + Date.now(),
            role: "assistant",
            content: data.reply,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: "msg_error_" + Date.now(),
            role: "assistant",
            content: `⚠️ Failed to execute legal reasoning: ${data.error || "Server issue."}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: "msg_error_" + Date.now(),
          role: "assistant",
          content: "⚠️ Failed to connect to legal reasoning servers. Please check your network connection.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col h-[600px]" id="chat_container">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3.5 mb-4 shrink-0 flex items-center justify-between">
        <div>
          <h4 className="font-display text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <MessageSquare className="w-4.5 h-4.5 text-slate-800" /> Interactive Legal Companion
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Discuss your constitutional protections and dispute parameters in real-time.
          </p>
        </div>
      </div>

      {/* Linked Vault Documents list */}
      {documents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl mb-4 shrink-0 space-y-2.5 text-xs">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
            <Link className="w-3 h-3 text-slate-500" /> Grounding Context: Toggle Linked Vault Documents
          </span>
          <div className="flex flex-wrap gap-1.5">
            {documents.map((doc) => {
              const linked = vaultDocIds.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  onClick={() => toggleDocLink(doc.id)}
                  className={`px-3 py-1.5 border rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    linked
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                  id={`link_doc_btn_${doc.id}`}
                >
                  {doc.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 min-h-0">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            id={m.id}
          >
            <div
              className={`p-1.5 rounded-xl shrink-0 ${
                m.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 border border-slate-100 text-slate-800"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              <span className="block text-[9px] text-slate-400 mt-1.5 text-right font-mono">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 max-w-[85%] mr-auto" id="msg_typing_indicator">
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-800 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="shrink-0 flex gap-2 border-t border-slate-100 pt-3.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question (e.g. 'What is Article 21?', 'Is a 10 month deposit illegal?')"
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-500 font-sans disabled:opacity-50 text-slate-800"
          id="chat_input_text"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 shrink-0 cursor-pointer shadow-xs transition-all"
          id="chat_submit_btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-400 text-center mt-3 border-t border-slate-50 pt-2 shrink-0">
        🛡️ Guidance is educational. Grounded in RAG, not official advocacy counsel.
      </p>
    </div>
  );
}
