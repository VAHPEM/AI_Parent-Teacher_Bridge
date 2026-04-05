import { useState, useRef, useEffect } from "react";
import { Send, Bot, AlertCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParentChild } from "../../context/ParentChildContext";
import { api } from "../../lib/api";
import i18n from "i18next";

interface Message {
  id: number;
  from: "user" | "ai";
  content: string;
  timestamp: string;
}

export function ParentAIChat() {
  const { activeChild: student } = useParentChild();
  const { t } = useTranslation("ai-chat");
  const { t: tCommon } = useTranslation("common");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: "ai", content: t("greeting"), timestamp: tCommon("just_now") }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ id: 1, from: "ai", content: t("greeting"), timestamp: tCommon("just_now") }]);
    setInput("");
  }, [i18n.language]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = (text?: string) => {
    const question = text || input;
    if (!question.trim() || !student) return;
    setMessages(prev => [...prev, { id: prev.length + 1, from: "user", content: question, timestamp: tCommon("just_now") }]);
    setInput("");
    setTyping(true);
    api.post<{reply: string}>(`/parent/chat/${student.id}`, { message: question })
      .then(res => {
        setMessages(prev => [...prev, { id: prev.length + 1, from: "ai", content: res.reply, timestamp: tCommon("just_now") }]);
      })
      .catch(() => {
        setMessages(prev => [...prev, { id: prev.length + 1, from: "ai", content: t("error_message"), timestamp: tCommon("just_now") }]);
      })
      .finally(() => setTyping(false));
  };

  if (!student) return null;

  return (
    <>
      <div className="flex flex-col" style={{ height: "calc(100vh - 57px)" }}>

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#2563EB" }}>
              <Bot size={20} color="white" />
            </div>
            <div>
              <h1 className="text-sm" style={{ fontWeight: 700, color: "#1E293B" }}>{t("title")}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <p className="text-xs" style={{ color: "#64748B" }}>{t("status")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 p-3 rounded-xl flex items-start gap-2 shrink-0" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#2563EB" }} />
          <p className="text-xs" style={{ color: "#1E40AF", lineHeight: "1.6" }} dangerouslySetInnerHTML={{ __html: t("info_banner", { firstName: student.firstName, pronoun: student.firstName === 'Ella' ? 'her' : 'his' }) }}>
          </p>
        </div>

        {/* Suggested questions */}
        <div className="px-6 pt-4 shrink-0">
          <p className="text-xs mb-2" style={{ color: "#94A3B8", fontWeight: 500, letterSpacing: "0.05em" }}>{t("suggested_label")}</p>
          <div className="flex flex-wrap gap-2">
            {(t("suggested_questions", { returnObjects: true, firstName: student.firstName, pronoun: student.firstName === 'Ella' ? 'her' : 'his' }) as string[]).map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                style={{ color: "#64748B" }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} gap-2.5`}>
              {msg.from === "ai" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ backgroundColor: "#2563EB" }}>
                  <Bot size={14} color="white" />
                </div>
              )}
              <div className={`max-w-[70%] flex flex-col ${msg.from === "user" ? "items-end" : "items-start"}`}>
                <div
                  className="px-4 py-3 text-sm"
                  style={{
                    backgroundColor: msg.from === "user" ? "#2563EB" : "white",
                    color: msg.from === "user" ? "white" : "#1E293B",
                    borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    lineHeight: "1.7",
                    border: msg.from === "ai" ? "1px solid #E2E8F0" : "none",
                    boxShadow: msg.from === "ai" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {msg.content}
                </div>
                <span className="text-xs mt-1" style={{ color: "#94A3B8" }}>{msg.timestamp}</span>
              </div>
              {msg.from === "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1" style={{ backgroundColor: "#10B981", fontWeight: 700 }}>
                  SW
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#2563EB" }}>
                <Bot size={14} color="white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm border border-slate-200 bg-white">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 bg-white px-6 py-4 shrink-0">
          <div className="flex gap-3 items-center">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-300" style={{ backgroundColor: "#F8FAFC" }}>
              <Sparkles size={15} style={{ color: "#2563EB", flexShrink: 0 }} />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder={t("input_placeholder", { firstName: student.firstName })}
                className="flex-1 text-sm bg-transparent focus:outline-none"
                style={{ color: "#1E293B" }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || typing}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-all disabled:opacity-40"
              style={{ backgroundColor: "#2563EB" }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
